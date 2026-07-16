import "server-only";

// vector-search.service.ts — Sesión 4 (RAG), Prompt 6: motor de recuperación.
//
// Única responsabilidad: transformar una consulta en lenguaje natural en un
// conjunto ordenado de artículos relevantes. NO llama al LLM ni construye el
// contexto — eso es de context-builder (Prompt 7) y chat.service (Prompt 8).
//
// Flujo: consulta -> embedding de la consulta (embedding.service) -> búsqueda
// por similitud (función SQL match_article_embeddings) -> Top-K estructurado.
//
// Recibe el cliente de Supabase de la SESIÓN del usuario (server client). Como
// match_article_embeddings es SECURITY INVOKER, la RLS se aplica al llamante:
// la recuperación solo devuelve artículos que el usuario puede ver.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";
import type { RetrievedArticle } from "@readhub/types/rag";
import { embeddingService } from "@readhub/ai/embedding.service";

type Client = SupabaseClient<Database>;

export interface VectorSearchOptions {
  matchCount?: number; // Top-K
  matchThreshold?: number; // similitud mínima [0..1]
}

// Valores por defecto justificados:
//   * matchCount = 5: suficiente para dar contexto variado al LLM sin diluir la
//     relevancia ni disparar el consumo de tokens.
//   * matchThreshold = 0.3: con gte-small (coseno), los documentos realmente
//     relacionados suelen puntuar >= 0.3; por debajo tiende a ser ruido. Filtrar
//     aquí evita que consultas sin relación arrastren artículos irrelevantes.
export const DEFAULT_MATCH_COUNT = 5;
export const DEFAULT_MATCH_THRESHOLD = 0.3;

export const vectorSearchService = {
  search: async (
    client: Client,
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<RetrievedArticle[]> => {
    const normalized = query.trim();
    if (!normalized) return [];

    const embedding = await embeddingService.generateEmbedding(normalized);

    const { data, error } = await client.rpc("match_article_embeddings", {
      // pgvector espera el vector como literal de texto "[...]".
      query_embedding: JSON.stringify(embedding),
      match_threshold: options.matchThreshold ?? DEFAULT_MATCH_THRESHOLD,
      match_count: options.matchCount ?? DEFAULT_MATCH_COUNT,
    });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => ({
      articleId: row.article_id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      similarity: row.similarity,
    }));
  },
};
