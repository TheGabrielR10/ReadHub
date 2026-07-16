// Route Handler del chat RAG (Sesión 4, Prompt 8/9). Corre en Node (el pipeline
// de embeddings usa onnxruntime-node). Exige sesión autenticada y usa el cliente
// de servidor con la sesión del usuario, de modo que la recuperación respeta la
// RLS (solo artículos visibles).
//
// Protocolo de respuesta: streaming de texto plano en el cuerpo + las fuentes
// citadas en la cabecera "X-Rag-Sources" (JSON en base64). La UI lee las fuentes
// de la cabecera antes de consumir el stream del cuerpo.

import { createClient } from "@readhub/database/supabase/server";
import { chatService } from "@readhub/ai/chat.service";

export const runtime = "nodejs";
// La primera carga del modelo de embeddings (cold start) puede tardar hasta
// ~2 minutos; se pide el máximo permitido para darle margen. En Vercel Hobby
// el límite real es 60s (Next.js permite declarar más, la plataforma lo acota).
export const maxDuration = 60;

interface ChatRequestBody {
  query?: string;
}

function jsonError(code: string, message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  let query: string | null = null;
  try {
    const body = (await request.json()) as ChatRequestBody;
    query = typeof body.query === "string" ? body.query.trim() : null;
  } catch {
    return jsonError("VALIDATION_ERROR", "Cuerpo inválido.", 422);
  }

  if (!query) {
    return jsonError("VALIDATION_ERROR", "La consulta no puede estar vacía.", 422);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "No autenticado.", 401);
  }

  let chat;
  try {
    chat = await chatService.streamAnswer(supabase, query);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fallo del asistente.";
    return jsonError("INTERNAL_ERROR", message, 500);
  }

  const sourcesHeader = Buffer.from(JSON.stringify(chat.sources)).toString("base64");
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of chat.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n\n[Se interrumpió la generación de la respuesta.]")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Rag-Sources": sourcesHeader,
    },
  });
}
