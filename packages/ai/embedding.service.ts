import "server-only";

// embedding.service.ts — Sesión 4 (RAG), Prompt 4.
//
// Centraliza TODA la lógica de embeddings. Ningún otro módulo conoce el
// proveedor: si mañana se cambia gte-small por OpenAI/Voyage, solo cambia este
// archivo (mientras se respete EMBEDDING_DIMENSIONS, que fija la migración).
//
// Proveedor actual: Transformers.js corriendo en local (modelo Supabase/gte-small,
// 384 dimensiones). Sin API keys ni costo. Es server-only (usa onnxruntime-node),
// por eso el `import "server-only"`: si alguien lo importa desde un componente de
// cliente, el build falla en vez de intentar empaquetar el runtime nativo.

import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

export const EMBEDDING_MODEL = "Supabase/gte-small";
export const EMBEDDING_DIMENSIONS = 384;

// El pipeline se carga una sola vez (el modelo pesa ~120 MB y se descarga en la
// primera llamada). Se cachea la promesa para que llamadas concurrentes durante
// la carga inicial compartan la misma instancia en vez de cargar el modelo N veces.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", EMBEDDING_MODEL);
  }
  return extractorPromise;
}

// Estrategia de composición del texto a vectorizar (Prompt 4 — "extracción del
// conocimiento"). Orden por relevancia decreciente: el título es la señal más
// fuerte de la intención de una consulta, seguido del resumen y del contenido.
// Se ignoran partes vacías para no introducir ruido. El resultado es también el
// texto que se guarda en article_embeddings.content y que alimenta el contexto
// del LLM más adelante (Prompt 7).
export interface EmbeddingSourceParts {
  title: string;
  summary?: string | null;
  content?: string | null;
}

function buildEmbeddingText(parts: EmbeddingSourceParts): string {
  return [parts.title, parts.summary, parts.content]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw new Error("embedding.service: el texto a vectorizar está vacío.");
  }

  const extractor = await getExtractor();
  // pooling "mean" + normalize: gte-small requiere media de tokens y vectores
  // normalizados para que la distancia coseno del índice sea consistente.
  const output = await extractor(normalized, { pooling: "mean", normalize: true });
  const vector = Array.from(output.data as Float32Array);

  // Consistencia: validar la dimensión antes de persistir (Prompt 4 — "validar
  // su dimensión, verificar consistencia"). Un desalineamiento aquí rompería la
  // función SQL match_article_embeddings(vector(384)).
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `embedding.service: dimensión inesperada ${vector.length}, se esperaban ${EMBEDDING_DIMENSIONS}.`
    );
  }

  return vector;
}

export const embeddingService = {
  buildEmbeddingText,
  generateEmbedding,

  // Conveniencia: compone el texto de un artículo y devuelve tanto el vector
  // como el texto exacto que se vectorizó (para guardarlo en .content).
  embedArticle: async (
    parts: EmbeddingSourceParts
  ): Promise<{ content: string; embedding: number[] }> => {
    const content = buildEmbeddingText(parts);
    const embedding = await generateEmbedding(content);
    return { content, embedding };
  },
};
