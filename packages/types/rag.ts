// Tipos compartidos del sistema RAG (Sesión 4).

// Señal que emite el modelo cuando NINGÚN artículo cubre la pregunta. La UI la
// detecta para ofrecer redactar un artículo nuevo en lugar de mostrar texto.
// Vive aquí (sin dependencias server-only) para compartirla entre el servicio
// de chat (servidor) y el hook useChat (cliente).
export const NO_COVERAGE_SIGNAL = "SIN_COBERTURA";

// Resultado crudo de la búsqueda semántica (vector-search.service).
export interface RetrievedArticle {
  articleId: string;
  title: string;
  summary: string | null;
  content: string;
  similarity: number; // 0..1 (coseno); mayor = más relevante
}

// Fuente citada que se muestra al usuario junto a la respuesta (Prompt 9).
export interface ChatSource {
  articleId: string;
  title: string;
  similarity: number;
  rank: number; // posición en el ranking, 1-indexado (coincide con [N] en la respuesta)
}

// Respuesta estructurada del servicio conversacional (Prompt 8).
export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}
