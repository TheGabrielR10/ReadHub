// Route Handler de indexación (Sesión 4, Prompt 5). Punto de entrada server-side
// para (re)generar el embedding de un artículo. Corre en Node porque el proveedor
// de embeddings (Transformers.js / onnxruntime-node) no funciona en Edge Runtime.
//
// Seguridad: exige sesión autenticada y que el solicitante sea el AUTOR del
// artículo (verificado con la sesión del usuario, bajo RLS). La escritura del
// vector se hace luego con el cliente admin (service_role), server-side.

import { NextResponse } from "next/server";

import { createClient } from "@readhub/database/supabase/server";
import { createAdminClient } from "@readhub/database/supabase/admin";
import { indexingService } from "@readhub/ai/indexing.service";

export const runtime = "nodejs";

interface IndexRequestBody {
  articleId?: string;
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// Verifica sesión + autoría. Devuelve el userId si todo está en orden, o una
// respuesta de error lista para retornar.
async function authorizeAuthor(
  articleId: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: errorResponse("UNAUTHENTICATED", "No autenticado.", 401) };
  }

  const { data: article, error } = await supabase
    .from("articles")
    .select("author_id")
    .eq("id", articleId)
    .maybeSingle();

  if (error) {
    return { ok: false, response: errorResponse("INTERNAL_ERROR", "Error al verificar el artículo.", 500) };
  }
  if (!article) {
    return { ok: false, response: errorResponse("NOT_FOUND", "El artículo no existe.", 404) };
  }
  if (article.author_id !== user.id) {
    return { ok: false, response: errorResponse("FORBIDDEN", "No eres el autor de este artículo.", 403) };
  }

  return { ok: true };
}

async function parseArticleId(request: Request): Promise<string | null> {
  try {
    const body = (await request.json()) as IndexRequestBody;
    return typeof body.articleId === "string" && body.articleId ? body.articleId : null;
  } catch {
    return null;
  }
}

// POST: (re)indexa el artículo (crear/editar).
export async function POST(request: Request) {
  const articleId = await parseArticleId(request);
  if (!articleId) {
    return errorResponse("VALIDATION_ERROR", "Falta articleId.", 422);
  }

  const auth = await authorizeAuthor(articleId);
  if (!auth.ok) return auth.response;

  try {
    await indexingService.indexArticle(createAdminClient(), articleId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fallo al indexar.";
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}

// DELETE: elimina el embedding (despublicación manual). El borrado del artículo
// en sí ya limpia el vector vía ON DELETE CASCADE, sin pasar por aquí.
export async function DELETE(request: Request) {
  const articleId = await parseArticleId(request);
  if (!articleId) {
    return errorResponse("VALIDATION_ERROR", "Falta articleId.", 422);
  }

  const auth = await authorizeAuthor(articleId);
  if (!auth.ok) return auth.response;

  try {
    await indexingService.removeArticleIndex(createAdminClient(), articleId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fallo al eliminar el índice.";
    return errorResponse("INTERNAL_ERROR", message, 500);
  }
}
