// Estadísticas y autores de la plataforma (Sesión 5, Fase 5).
// Servicio reutilizable (lo consume el MCP; también útil para la web). Usa el
// cliente por inyección y respeta la RLS (el conteo de artículos refleja solo lo
// visible; el de vistas va por la función SECURITY DEFINER get_article_view_counts).

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";

type Client = SupabaseClient<Database>;

export interface PlatformStats {
  articles: number;
  authors: number;
  likes: number;
  comments: number;
  views: number;
}

export interface AuthorSummary {
  id: string;
  email: string;
  articleCount: number;
}

async function countRows(
  client: Client,
  table: "articles" | "likes" | "comments"
): Promise<number> {
  const { count } = await client.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export const statsService = {
  getPlatformStats: async (client: Client): Promise<PlatformStats> => {
    const [articles, likes, comments, artRows] = await Promise.all([
      countRows(client, "articles"),
      countRows(client, "likes"),
      countRows(client, "comments"),
      client.from("articles").select("id, author_id"),
    ]);

    const rows = artRows.data ?? [];
    const authors = new Set(rows.map((r) => r.author_id)).size;

    const ids = rows.map((r) => r.id);
    let views = 0;
    if (ids.length > 0) {
      const { data } = await client.rpc("get_article_view_counts", { article_ids: ids });
      views = (data ?? []).reduce((sum, r) => sum + Number(r.count), 0);
    }

    return { articles, authors, likes, comments, views };
  },

  getAuthors: async (client: Client): Promise<AuthorSummary[]> => {
    const { data, error } = await client.from("articles").select("author_id");
    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1);
    }

    return Promise.all(
      Array.from(counts.entries()).map(async ([id, articleCount]) => {
        const { data: email } = await client.rpc("get_user_email", { user_id: id });
        return { id, email: email ?? "", articleCount };
      })
    );
  },
};
