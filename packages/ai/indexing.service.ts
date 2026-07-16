import "server-only";

// indexing.service.ts — Sesión 4 (RAG), Prompt 5: indexación automática.
//
// Mantiene la base vectorial sincronizada con los artículos. Reutiliza
// embedding.service (no duplica lógica de embeddings) y escribe con el cliente
// admin (service_role), porque la generación del vector ocurre en servidor y no
// debe depender de la sesión del usuario.
//
// Estrategia de sincronización (decisión Prompt 5):
//   * Se descarta un trigger de Postgres: el proveedor de embeddings es una
//     librería de Node (Transformers.js), inalcanzable desde el motor SQL sin
//     una Edge Function intermedia. Un hook a nivel de aplicación reutiliza el
//     mismo embedding.service sin infraestructura extra.
//   * Consistencia: upsert por article_id (PK) => un artículo tiene SIEMPRE una
//     única representación vectorial vigente; una edición reemplaza la anterior.
//   * Borrado: no requiere acción — el ON DELETE CASCADE de article_embeddings
//     elimina el vector al borrarse el artículo (sin registros huérfanos). Se
//     expone removeArticleIndex() para el caso de despublicación manual.

import type { AdminClient } from "@readhub/database/supabase/admin";
import { embeddingService } from "@readhub/ai/embedding.service";

// Extrae texto del documento para enriquecer el embedding. Best-effort: solo
// para .txt (lectura directa). PDF/DOCX requerirían parsers pesados fuera del
// alcance de esta sesión; en esos casos el embedding usa título + resumen, que
// para el corpus de ReadHub ya da una recuperación semántica útil.
async function fetchDocumentText(
  admin: AdminClient,
  documentPath: string
): Promise<string | null> {
  if (!documentPath.toLowerCase().endsWith(".txt")) return null;
  try {
    const { data, error } = await admin.storage
      .from("article-documents")
      .download(documentPath);
    if (error || !data) return null;
    const text = await data.text();
    // Se acota para no vectorizar documentos enormes (gte-small trunca a ~512
    // tokens de todas formas; recortar reduce ruido y coste de descarga).
    return text.slice(0, 8000);
  } catch {
    return null;
  }
}

export const indexingService = {
  // (Re)genera y persiste el embedding de un artículo. Idempotente vía upsert.
  indexArticle: async (admin: AdminClient, articleId: string): Promise<void> => {
    const { data: article, error } = await admin
      .from("articles")
      .select("id, title, summary, content, document_path")
      .eq("id", articleId)
      .maybeSingle();

    if (error) throw error;
    if (!article) return; // el artículo no existe (p. ej. borrado en carrera): nada que indexar

    // Cuerpo a vectorizar: el texto propio del artículo (content) y/o el texto
    // extraíble del documento adjunto (.txt). Ambos son opcionales.
    const docText = article.document_path
      ? await fetchDocumentText(admin, article.document_path)
      : null;
    const body = [article.content, docText].filter(Boolean).join("\n\n") || null;

    const { content: embeddedText, embedding } = await embeddingService.embedArticle({
      title: article.title,
      summary: article.summary,
      content: body,
    });

    const { error: upsertError } = await admin
      .from("article_embeddings")
      .upsert(
        {
          article_id: article.id,
          content: embeddedText,
          // pgvector recibe el vector como literal de texto "[...]" vía PostgREST.
          embedding: JSON.stringify(embedding),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "article_id" }
      );

    if (upsertError) throw upsertError;
  },

  // Elimina el embedding de un artículo (despublicación/limpieza manual).
  removeArticleIndex: async (
    admin: AdminClient,
    articleId: string
  ): Promise<void> => {
    const { error } = await admin
      .from("article_embeddings")
      .delete()
      .eq("article_id", articleId);
    if (error) throw error;
  },
};
