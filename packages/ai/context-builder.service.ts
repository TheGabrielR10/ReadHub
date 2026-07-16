// context-builder.service.ts — Sesión 4 (RAG), Prompt 7.
//
// Puente entre el motor de recuperación (Prompt 6) y el LLM (Prompt 8).
// Transforma los documentos recuperados en un prompt estructurado + la lista de
// fuentes. NO busca ni llama a ningún proveedor de IA: solo prepara el contexto.
//
// Decisiones (justificación):
//   * Organización: los documentos se ordenan por relevancia (ya vienen así) y
//     se numeran [1], [2]... Cada bloque lleva su título e identificador para
//     que el modelo pueda citar la fuente y para mostrarla luego al usuario.
//   * Selección: no todo lo recuperado entra. Se descartan documentos por debajo
//     de un umbral de relevancia y se limita la cantidad, evitando arrastrar
//     material poco pertinente al contexto.
//   * Control de tamaño: presupuesto de caracteres configurable (no fijo), con
//     recorte por documento, para evitar exceso de tokens y degradación.
//   * Gestión de fuentes: cada fragmento conserva su origen (artículo, título,
//     similitud, ranking), base del panel de fuentes de la interfaz.

import { NO_COVERAGE_SIGNAL, type RetrievedArticle, type ChatSource } from "@readhub/types/rag";

export interface ContextBuildOptions {
  maxDocuments?: number; // máximo de documentos en el contexto
  minSimilarity?: number; // umbral de inclusión [0..1]
  maxContextChars?: number; // presupuesto total de caracteres del contexto
  maxCharsPerDocument?: number; // recorte por documento
}

export interface BuiltContext {
  systemPrompt: string;
  userPrompt: string;
  sources: ChatSource[];
  hasContext: boolean; // false => no hay material suficiente para responder
}

// Presupuestos por defecto (configurables). Pensados para gte-small + un chat
// conciso: contexto amplio pero acotado para no disparar tokens ni latencia.
export const DEFAULT_MAX_DOCUMENTS = 5;
export const DEFAULT_MIN_SIMILARITY = 0.3;
export const DEFAULT_MAX_CONTEXT_CHARS = 6000;
export const DEFAULT_MAX_CHARS_PER_DOCUMENT = 1500;

const SYSTEM_PROMPT = [
  "Eres el asistente inteligente de ReadHub, una plataforma de artículos.",
  "Responde la pregunta del usuario ÚNICAMENTE con la información contenida en los artículos que se te proporcionan como CONTEXTO. No inventes ni uses conocimiento externo.",
  `Si NINGÚN artículo del contexto contiene información para responder la pregunta, responde ÚNICAMENTE con la palabra exacta ${NO_COVERAGE_SIGNAL} y nada más (sin explicaciones, sin puntuación).`,
  "Si al menos un artículo permite responder, hazlo citando la fuente con su número entre corchetes, por ejemplo [1] o [2].",
  "Responde de forma directa, clara y concisa. No incluyas tu razonamiento paso a paso; da solo la respuesta final.",
].join(" ");

function clip(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

export const contextBuilderService = {
  build: (
    query: string,
    retrieved: RetrievedArticle[],
    options: ContextBuildOptions = {}
  ): BuiltContext => {
    const maxDocuments = options.maxDocuments ?? DEFAULT_MAX_DOCUMENTS;
    const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY;
    const maxContextChars = options.maxContextChars ?? DEFAULT_MAX_CONTEXT_CHARS;
    const maxCharsPerDocument =
      options.maxCharsPerDocument ?? DEFAULT_MAX_CHARS_PER_DOCUMENT;

    // Selección: filtra por relevancia y limita la cantidad.
    const selected = retrieved
      .filter((doc) => doc.similarity >= minSimilarity)
      .slice(0, maxDocuments);

    if (selected.length === 0) {
      return {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Pregunta del usuario: ${query}\n\n(No hay artículos de contexto disponibles.)`,
        sources: [],
        hasContext: false,
      };
    }

    // Construcción del contexto respetando el presupuesto total de caracteres.
    const blocks: string[] = [];
    const sources: ChatSource[] = [];
    let budget = maxContextChars;

    for (let i = 0; i < selected.length; i++) {
      const doc = selected[i];
      const rank = i + 1;
      const body = clip(doc.content, Math.min(maxCharsPerDocument, budget));
      if (!body) break;

      blocks.push(`[${rank}] Título: ${doc.title}\n${body}`);
      sources.push({
        articleId: doc.articleId,
        title: doc.title,
        similarity: doc.similarity,
        rank,
      });

      budget -= body.length;
      if (budget <= 0) break;
    }

    const context = blocks.join("\n\n---\n\n");
    const userPrompt = [
      "CONTEXTO (artículos de ReadHub):",
      "",
      context,
      "",
      "---",
      "",
      `Pregunta del usuario: ${query}`,
    ].join("\n");

    return {
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      sources,
      hasContext: true,
    };
  },
};
