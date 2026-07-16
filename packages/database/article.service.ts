// Service para operaciones sobre artículos.
// Recibe el cliente de Supabase por inyección (browser o server) para poder
// usarse tanto desde hooks de cliente como desde Server Components (ver
// services/auth.service.ts / auth.server.ts para la razón de este patrón).

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";
import type {
  ArticleListItem,
  ArticleDetail,
  CreateArticleInput,
  UpdateArticleInput,
} from "@readhub/types/article";
import { storageService } from "@readhub/database/storage.service";
import { commentService } from "@readhub/database/comment.service";

type Client = SupabaseClient<Database>;

interface ArticleWithCountsRow {
  id: string;
  title: string;
  summary: string | null;
  image_path: string;
  author_id: string;
  created_at: string;
  is_public: boolean;
  likes: { count: number }[];
}

interface ArticleDetailRow extends ArticleWithCountsRow {
  content: string | null;
  document_path: string | null;
}

// El conteo de "views" NO se embebe: la política RLS de views (SELECT solo
// admin/autor) lo devolvería como 0 para artículos ajenos. Se resuelve aparte
// con la función get_article_view_counts (SECURITY DEFINER), que expone solo el
// número agregado. Los "likes" sí se embeben (su SELECT es público).
const LIST_SELECT =
  "id, title, summary, image_path, author_id, created_at, is_public, likes:likes(count)";

const DETAIL_SELECT =
  "id, title, summary, content, image_path, document_path, author_id, created_at, is_public, likes:likes(count)";

// Conteos de vistas por artículo (vía RPC que salta la RLS de views para el
// agregado). Devuelve un mapa articleId -> count; 0 para los que no aparecen.
async function resolveViewCounts(
  client: Client,
  articleIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (articleIds.length === 0) return map;
  const { data } = await client.rpc("get_article_view_counts", {
    article_ids: articleIds,
  });
  for (const row of data ?? []) {
    map.set(row.article_id, Number(row.count));
  }
  return map;
}

// El esquema no expone un nombre de usuario; get_user_email() (SECURITY DEFINER,
// ver migración 20260706005100) resuelve el email para mostrarlo como autor.
async function resolveAuthorEmails(
  client: Client,
  authorIds: string[]
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(authorIds));
  const entries = await Promise.all(
    uniqueIds.map(async (authorId) => {
      const { data } = await client.rpc("get_user_email", {
        user_id: authorId,
      });
      return [authorId, data ?? ""] as const;
    })
  );
  return new Map(entries);
}

function toListItem(
  row: ArticleWithCountsRow,
  emailMap: Map<string, string>,
  viewsCount: number,
  client: Client
): ArticleListItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    imageUrl: storageService.getPublicUrl(client, "article-images", row.image_path),
    author: { id: row.author_id, email: emailMap.get(row.author_id) ?? "" },
    createdAt: row.created_at,
    viewsCount,
    likesCount: row.likes?.[0]?.count ?? 0,
  };
}

// Enriquece filas de artículos con email de autor, conteo real de vistas y el
// estado de "me gusta" del usuario actual — en paralelo. Compartido por
// getArticles y searchArticles para no duplicar la lógica de mapeo.
async function buildListItems(
  client: Client,
  rows: ArticleWithCountsRow[],
  currentUserId?: string
): Promise<ArticleListItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const [emailMap, viewCounts, likedIds] = await Promise.all([
    resolveAuthorEmails(client, rows.map((row) => row.author_id)),
    resolveViewCounts(client, ids),
    currentUserId
      ? client
          .from("likes")
          .select("article_id")
          .eq("user_id", currentUserId)
          .in("article_id", ids)
          .then(({ data: rows2 }) => new Set((rows2 ?? []).map((r) => r.article_id)))
      : Promise.resolve(new Set<string>()),
  ]);

  return rows.map((row) => ({
    ...toListItem(row, emailMap, viewCounts.get(row.id) ?? 0, client),
    hasLikedByCurrentUser: likedIds.has(row.id),
  }));
}

export const articleService = {
  // Listado para la página principal (Flujo 4 / 8.2). Solo devuelve lo que
  // la RLS de "articles" permite ver al usuario autenticado (públicos + propios).
  getArticles: async (
    client: Client,
    currentUserId?: string
  ): Promise<ArticleListItem[]> => {
    const { data, error } = await client
      .from("articles")
      .select(LIST_SELECT)
      .order("created_at", { ascending: false })
      .returns<ArticleWithCountsRow[]>();

    if (error) throw error;
    return buildListItems(client, data ?? [], currentUserId);
  },

  // Búsqueda por texto en título/resumen (usada por la Tool MCP buscar_articulos).
  // Distinta de la búsqueda semántica: aquí es coincidencia literal (ilike).
  searchArticles: async (
    client: Client,
    query: string,
    currentUserId?: string
  ): Promise<ArticleListItem[]> => {
    // Se neutralizan caracteres con significado en el filtro PostgREST/ilike.
    const term = query.replace(/[%,()*\\]/g, " ").trim();
    if (!term) return [];

    const { data, error } = await client
      .from("articles")
      .select(LIST_SELECT)
      .or(`title.ilike.%${term}%,summary.ilike.%${term}%`)
      .order("created_at", { ascending: false })
      .returns<ArticleWithCountsRow[]>();

    if (error) throw error;
    return buildListItems(client, data ?? [], currentUserId);
  },

  // Detalle de artículo (Flujo 5 / 8.4): contenido, comentarios y estado de like
  // del usuario actual. No registra la visualización — eso es responsabilidad
  // explícita de registerView(), invocada aparte por el consumidor.
  getArticle: async (
    client: Client,
    id: string,
    currentUserId?: string
  ): Promise<ArticleDetail | null> => {
    const { data: row, error } = await client
      .from("articles")
      .select(DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle<ArticleDetailRow>();

    if (error) throw error;
    if (!row) return null;

    const [emailMap, viewCounts, comments, hasLiked] = await Promise.all([
      resolveAuthorEmails(client, [row.author_id]),
      resolveViewCounts(client, [id]),
      commentService.getComments(client, id),
      currentUserId
        ? articleService.hasLiked(client, id, currentUserId)
        : Promise.resolve(false),
    ]);

    return {
      ...toListItem(row, emailMap, viewCounts.get(id) ?? 0, client),
      content: row.content,
      // El documento es opcional: si no hay, documentUrl es null.
      documentUrl: row.document_path
        ? storageService.getPublicUrl(client, "article-documents", row.document_path)
        : null,
      isPublic: row.is_public,
      hasLikedByCurrentUser: hasLiked,
      comments,
    };
  },

  // Publicación de artículo (Flujo 6 / 8.3). Los archivos ya deben haberse
  // subido previamente vía storageService; aquí solo se registra el artículo.
  createArticle: async (
    client: Client,
    authorId: string,
    input: CreateArticleInput
  ) => {
    const { data, error } = await client
      .from("articles")
      .insert({
        author_id: authorId,
        title: input.title,
        summary: input.summary ?? null,
        content: input.content ?? null,
        document_path: input.documentPath ?? null,
        image_path: input.imagePath,
        is_public: input.isPublic ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateArticle: async (client: Client, id: string, input: UpdateArticleInput) => {
    const { data, error } = await client
      .from("articles")
      .update({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.isPublic !== undefined && { is_public: input.isPublic }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteArticle: async (client: Client, id: string): Promise<void> => {
    const { error } = await client.from("articles").delete().eq("id", id);
    if (error) throw error;
  },

  // Flujo 5: registra una nueva visualización cada vez que se abre el artículo
  // (evento independiente, sin contador — según supabase/migrations/..._create_interaction_tables.sql).
  registerView: async (
    client: Client,
    articleId: string,
    userId: string
  ): Promise<void> => {
    const { error } = await client
      .from("views")
      .insert({ article_id: articleId, user_id: userId });

    if (error) throw error;
  },

  // Flujo 8: la unicidad (un usuario, un like por artículo) la garantiza la
  // restricción UNIQUE(article_id, user_id) de la tabla; aquí se propaga el
  // error de conflicto (23505) para que la capa de hooks decida cómo tratarlo.
  likeArticle: async (
    client: Client,
    articleId: string,
    userId: string
  ): Promise<void> => {
    const { error } = await client
      .from("likes")
      .insert({ article_id: articleId, user_id: userId });

    if (error) throw error;
  },

  unlikeArticle: async (
    client: Client,
    articleId: string,
    userId: string
  ): Promise<void> => {
    const { error } = await client
      .from("likes")
      .delete()
      .eq("article_id", articleId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  hasLiked: async (
    client: Client,
    articleId: string,
    userId: string
  ): Promise<boolean> => {
    const { data, error } = await client
      .from("likes")
      .select("id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },
};
