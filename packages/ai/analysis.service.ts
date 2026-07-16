import "server-only";

// analysis.service.ts — Sesión 5, Fase 7: capacidades de análisis avanzado.
// Convierte ReadHub en una base de conocimiento consultable por LLMs. Reutiliza
// la infraestructura existente (búsqueda vectorial, context-builder, completado)
// sin duplicar lógica: retrieval puro donde basta, y LLM donde hace falta análisis.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";
import type { RetrievedArticle, ChatSource } from "@readhub/types/rag";
import type { ArticleDetail } from "@readhub/types/article";
import { vectorSearchService } from "@readhub/ai/vector-search.service";
import { contextBuilderService } from "@readhub/ai/context-builder.service";
import { complete } from "@readhub/ai/completion";
import { articleService } from "@readhub/database/article.service";

type Client = SupabaseClient<Database>;

const ANALYSIS_MAX_TOKENS = 1200;

function blurb(a: ArticleDetail): string {
  return `Título: ${a.title}\nResumen: ${a.summary ?? "(sin resumen)"}\nAutor: ${a.author.email}`;
}

function corpus(items: RetrievedArticle[]): string {
  return items
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content.slice(0, 800)}`)
    .join("\n\n");
}

export const analysisService = {
  // Relaciones entre documentos: artículos semánticamente relacionados con uno
  // dado. Retrieval puro (sin LLM): reutiliza la búsqueda vectorial.
  relatedDocuments: async (
    client: Client,
    articleId: string,
    limit = 5
  ): Promise<RetrievedArticle[]> => {
    const article = await articleService.getArticle(client, articleId);
    if (!article) return [];
    const queryText = [article.title, article.summary].filter(Boolean).join(". ");
    const results = await vectorSearchService.search(client, queryText, {
      matchCount: limit + 1,
      matchThreshold: 0,
    });
    return results.filter((r) => r.articleId !== articleId).slice(0, limit);
  },

  // Construcción de contexto para investigaciones: reutiliza vector-search +
  // context-builder y devuelve el prompt estructurado y las fuentes (sin LLM).
  buildResearchContext: async (
    client: Client,
    query: string,
    k = 5
  ): Promise<{ hasContext: boolean; prompt: string; sources: ChatSource[] }> => {
    const retrieved = await vectorSearchService.search(client, query, { matchCount: k });
    const built = contextBuilderService.build(query, retrieved);
    return { hasContext: built.hasContext, prompt: built.userPrompt, sources: built.sources };
  },

  // Comparar múltiples artículos: similitudes, diferencias y contradicciones (LLM).
  compareArticles: async (client: Client, ids: string[]): Promise<string> => {
    const articles = await Promise.all(ids.map((id) => articleService.getArticle(client, id)));
    const bloques = articles
      .map((a, i) =>
        a ? `--- Artículo ${i + 1} ---\n${blurb(a)}` : `--- Artículo ${i + 1}: no encontrado ---`
      )
      .join("\n\n");
    const system =
      "Eres un analista de contenidos de ReadHub. Compara los artículos indicando similitudes, diferencias y posibles contradicciones, de forma clara y estructurada. Básate ÚNICAMENTE en la información proporcionada.";
    return complete(system, bloques, ANALYSIS_MAX_TOKENS);
  },

  // Temas principales transversales a los artículos relevantes de una consulta (LLM).
  extractTopics: async (client: Client, query: string, k = 8): Promise<string> => {
    const retrieved = await vectorSearchService.search(client, query, { matchCount: k });
    if (retrieved.length === 0) return "No se encontraron artículos relacionados.";
    const system =
      "Eres un analista de ReadHub. A partir de los artículos, identifica y lista los TEMAS PRINCIPALES transversales, cada uno con una frase que lo describa. Básate solo en el contenido dado.";
    return complete(system, `Consulta: ${query}\n\n${corpus(retrieved)}`, ANALYSIS_MAX_TOKENS);
  },

  // Resumen global que sintetiza el conjunto de artículos relevantes (LLM + fuentes).
  globalSummary: async (
    client: Client,
    query: string,
    k = 8
  ): Promise<{ summary: string; sources: ChatSource[] }> => {
    const retrieved = await vectorSearchService.search(client, query, { matchCount: k });
    if (retrieved.length === 0) {
      return { summary: "No se encontraron artículos relacionados.", sources: [] };
    }
    const system =
      "Eres un analista de ReadHub. Redacta un RESUMEN GLOBAL que sintetice lo que dicen en conjunto los artículos sobre el tema, citando con [n]. Básate solo en el contenido dado.";
    const summary = await complete(system, `Tema: ${query}\n\n${corpus(retrieved)}`, ANALYSIS_MAX_TOKENS);
    const sources: ChatSource[] = retrieved.map((r, i) => ({
      articleId: r.articleId,
      title: r.title,
      similarity: r.similarity,
      rank: i + 1,
    }));
    return { summary, sources };
  },
};
