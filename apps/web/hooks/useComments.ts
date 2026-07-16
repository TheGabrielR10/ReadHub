"use client";

// Hook para gestionar comentarios de un artículo. Consume únicamente
// commentService — el hook solo instancia el cliente para inyectarlo (DI).

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@readhub/database/supabase/client";
import { commentService } from "@readhub/database/comment.service";
import type { CommentWithAuthor } from "@readhub/types/comment";

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useComments(articleId?: string) {
  const supabase = useMemo(() => createClient(), []);

  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(
    async (id: string): Promise<CommentWithAuthor[]> => {
      setLoading(true);
      setError(null);
      try {
        const data = await commentService.getComments(supabase, id);
        setComments(data);
        return data;
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible obtener los comentarios."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Flujo 7: publicar comentario y reflejarlo de inmediato en la lista,
  // sin recargar la página.
  const createComment = useCallback(
    async (id: string, userId: string, comment: string) => {
      setError(null);
      try {
        const created = await commentService.createComment(
          supabase,
          id,
          userId,
          comment
        );
        setComments((prev) => [...prev, created]);
        return created;
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible publicar el comentario."));
        throw err;
      }
    },
    [supabase]
  );

  const updateComment = useCallback(
    async (commentId: string, comment: string) => {
      setError(null);
      try {
        await commentService.updateComment(supabase, commentId, comment);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, comment } : c))
        );
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible editar el comentario."));
        throw err;
      }
    },
    [supabase]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      setError(null);
      try {
        await commentService.deleteComment(supabase, commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible eliminar el comentario."));
        throw err;
      }
    },
    [supabase]
  );

  // Autocarga opcional: si se provee articleId, obtiene los comentarios al montar.
  useEffect(() => {
    if (articleId) {
      fetchComments(articleId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
  };
}
