"use client";

// Hook para gestionar artículos: listado, detalle, crear, editar, eliminar,
// registrar visualización. Consume únicamente articleService — el hook solo
// instancia el cliente de Supabase para inyectarlo en el service (DI), nunca
// llama .from()/.rpc()/.storage directamente.

import { useCallback, useMemo, useState } from "react";

import { createClient } from "@readhub/database/supabase/client";
import { articleService } from "@readhub/database/article.service";
import { indexingClient } from "@/services/indexing.client";
import type {
  ArticleListItem,
  ArticleDetail,
  CreateArticleInput,
  UpdateArticleInput,
} from "@readhub/types/article";

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useArticles() {
  const supabase = useMemo(() => createClient(), []);

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flujo 4 / 8.2: listado de la página principal. Recibe el userId para
  // resolver el estado de "me gusta" de cada tarjeta.
  const fetchArticles = useCallback(
    async (currentUserId?: string): Promise<ArticleListItem[]> => {
      setLoading(true);
      setError(null);
      try {
        const data = await articleService.getArticles(supabase, currentUserId);
        setArticles(data);
        return data;
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible obtener los artículos."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Flujo 5 / 8.4: detalle de artículo (contenido, comentarios, like del usuario).
  const fetchArticle = useCallback(
    async (id: string, currentUserId?: string): Promise<ArticleDetail | null> => {
      setLoading(true);
      setError(null);
      try {
        return await articleService.getArticle(supabase, id, currentUserId);
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible obtener el artículo."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Flujo 6 / 8.3: publicación (los archivos ya deben subirse antes con useUpload).
  const createArticle = useCallback(
    async (authorId: string, input: CreateArticleInput) => {
      setLoading(true);
      setError(null);
      try {
        const created = await articleService.createArticle(supabase, authorId, input);
        // Indexación automática (Prompt 5): best-effort, no bloquea la publicación.
        void indexingClient.triggerIndex(created.id);
        return created;
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible publicar el artículo."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const updateArticle = useCallback(
    async (id: string, input: UpdateArticleInput) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await articleService.updateArticle(supabase, id, input);
        // Reindexa si cambió el contenido semántico (título/resumen). Un cambio
        // solo de visibilidad también reindexa: es barato e idempotente.
        void indexingClient.triggerIndex(id);
        return updated;
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible actualizar el artículo."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const deleteArticle = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await articleService.deleteArticle(supabase, id);
        setArticles((prev) => prev.filter((article) => article.id !== id));
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible eliminar el artículo."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Flujo 5: se registra automáticamente al abrir un artículo. No bloquea la
  // lectura si falla — es una métrica secundaria, no crítica para el usuario.
  const registerView = useCallback(
    async (articleId: string, userId: string) => {
      try {
        await articleService.registerView(supabase, articleId, userId);
      } catch {
        // Falla silenciosa: ver el artículo no debe depender de esto.
      }
    },
    [supabase]
  );

  return {
    articles,
    loading,
    error,
    fetchArticles,
    fetchArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    registerView,
  };
}
