"use client";

// Hook para gestionar "me gusta" de un artículo. No existe un like.service.ts
// dedicado (ver arquitectura de services/): los likes se persisten a través
// de articleService (likeArticle/unlikeArticle/hasLiked), que ya expone el
// conteo embebido en getArticles/getArticle.

import { useCallback, useMemo, useState } from "react";

import { createClient } from "@readhub/database/supabase/client";
import { articleService } from "@readhub/database/article.service";

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export interface UseLikesOptions {
  articleId: string;
  userId?: string;
  initialLikesCount?: number;
  initialHasLiked?: boolean;
}

export function useLikes({
  articleId,
  userId,
  initialLikesCount = 0,
  initialHasLiked = false,
}: UseLikesOptions) {
  const supabase = useMemo(() => createClient(), []);

  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHasLiked = useCallback(async () => {
    if (!userId) return false;
    setLoading(true);
    setError(null);
    try {
      const liked = await articleService.hasLiked(supabase, articleId, userId);
      setHasLiked(liked);
      return liked;
    } catch (err) {
      setError(
        toErrorMessage(err, 'No fue posible verificar el estado del "me gusta".')
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, articleId, userId]);

  // Flujo 8: registra el "me gusta" y actualiza el contador. La unicidad
  // (un usuario, un like por artículo) la garantiza la restricción UNIQUE de
  // la tabla; aquí solo evitamos el intento redundante si ya se sabe que
  // hasLiked es true.
  const like = useCallback(async () => {
    if (!userId || hasLiked) return;
    setError(null);
    try {
      await articleService.likeArticle(supabase, articleId, userId);
      setHasLiked(true);
      setLikesCount((prev) => prev + 1);
    } catch (err) {
      setError(toErrorMessage(err, 'No fue posible registrar el "me gusta".'));
      throw err;
    }
  }, [supabase, articleId, userId, hasLiked]);

  const unlike = useCallback(async () => {
    if (!userId || !hasLiked) return;
    setError(null);
    try {
      await articleService.unlikeArticle(supabase, articleId, userId);
      setHasLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(toErrorMessage(err, 'No fue posible quitar el "me gusta".'));
      throw err;
    }
  }, [supabase, articleId, userId, hasLiked]);

  const toggleLike = useCallback(async () => {
    return hasLiked ? unlike() : like();
  }, [hasLiked, like, unlike]);

  return {
    likesCount,
    hasLiked,
    loading,
    error,
    like,
    unlike,
    toggleLike,
    checkHasLiked,
  };
}
