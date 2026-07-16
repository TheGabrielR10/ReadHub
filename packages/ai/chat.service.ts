import "server-only";

// chat.service.ts — Sesión 4 (RAG), Prompt 8: servicio conversacional.
//
// Único punto de entrada del asistente. Orquesta el flujo RAG completo
// reutilizando los servicios previos, sin duplicar su lógica:
//   consulta -> vector-search (recuperación) -> context-builder (prompt) ->
//   Claude (generación) -> respuesta estructurada.
//
// La integración con Claude está encapsulada en completion.ts (cliente único);
// este servicio orquesta el flujo RAG y reutiliza ese completado.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";
import { NO_COVERAGE_SIGNAL, type ChatSource, type ChatResponse } from "@readhub/types/rag";
import { vectorSearchService } from "@readhub/ai/vector-search.service";
import { contextBuilderService, type BuiltContext } from "@readhub/ai/context-builder.service";
import { getAnthropic, complete, LLM_MODEL } from "@readhub/ai/completion";

type Client = SupabaseClient<Database>;

const MAX_TOKENS = 1024;
const DRAFT_MAX_TOKENS = 1600;

// Prompt del asistente de redacción (cuando no existe artículo del tema y el
// usuario pide ayuda para escribir el primero).
const DRAFT_SYSTEM_PROMPT = [
  "Eres un asistente de redacción de ReadHub.",
  "El usuario quiere publicar el PRIMER artículo sobre un tema del que aún no hay contenido en la plataforma.",
  "Escribe un borrador de artículo en español, claro, bien estructurado y con tono divulgativo:",
  "primero una línea con el título (sin la palabra 'Título:'), y luego de 3 a 5 párrafos de contenido.",
  "No inventes datos, cifras ni estudios falsos; si algo es una opinión o generalización, exprésalo como tal.",
  "No incluyas metacomentarios sobre que es un borrador; entrega solo el artículo.",
].join(" ");

async function retrieveAndBuild(client: Client, query: string): Promise<BuiltContext> {
  const retrieved = await vectorSearchService.search(client, query);
  return contextBuilderService.build(query, retrieved);
}

async function* singleChunk(text: string): AsyncGenerator<string> {
  yield text;
}

export interface ChatStream {
  sources: ChatSource[];
  hasContext: boolean;
  textStream: AsyncIterable<string>;
}

export const chatService = {
  // Streaming (para la interfaz): entrega las fuentes de inmediato y un stream
  // de texto con la respuesta generada progresivamente.
  streamAnswer: async (client: Client, query: string): Promise<ChatStream> => {
    const built = await retrieveAndBuild(client, query);

    // Sin ningún documento recuperado: se emite la señal de "sin cobertura"
    // directamente (sin gastar una llamada al LLM). La UI ofrecerá redactar.
    if (!built.hasContext) {
      return { sources: [], hasContext: false, textStream: singleChunk(NO_COVERAGE_SIGNAL) };
    }

    const stream = getAnthropic().messages.stream({
      model: LLM_MODEL,
      max_tokens: MAX_TOKENS,
      system: built.systemPrompt,
      messages: [{ role: "user", content: built.userPrompt }],
    });

    async function* textStream(): AsyncGenerator<string> {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
    }

    return { sources: built.sources, hasContext: true, textStream: textStream() };
  },

  // Genera un borrador de artículo sobre un tema no cubierto (Opción del usuario:
  // "ayúdame a redactar"). No es RAG: es generación asistida. Devuelve un stream
  // de texto con el borrador.
  streamDraft: async (topic: string): Promise<AsyncIterable<string>> => {
    const clean = topic.trim();
    const stream = getAnthropic().messages.stream({
      model: LLM_MODEL,
      max_tokens: DRAFT_MAX_TOKENS,
      system: DRAFT_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Escribe un borrador de artículo sobre: ${clean}` },
      ],
    });

    async function* textStream(): AsyncGenerator<string> {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
    }

    return textStream();
  },

  // No-streaming: respuesta estructurada de una sola pieza (útil para QA y como
  // alternativa programática).
  answer: async (client: Client, query: string): Promise<ChatResponse> => {
    const built = await retrieveAndBuild(client, query);
    if (!built.hasContext) {
      return { answer: NO_COVERAGE_SIGNAL, sources: [] };
    }

    const answer = await complete(built.systemPrompt, built.userPrompt, MAX_TOKENS);
    return { answer, sources: built.sources };
  },
};
