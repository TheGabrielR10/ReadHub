// Route Handler de redacción asistida (Sesión 4, extensión UX). Genera un
// borrador de artículo sobre un tema no cubierto por ReadHub, en streaming.
// Node runtime; exige sesión autenticada.

import { createClient } from "@readhub/database/supabase/server";
import { chatService } from "@readhub/ai/chat.service";

export const runtime = "nodejs";

interface DraftRequestBody {
  topic?: string;
}

function jsonError(code: string, message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  let topic: string | null = null;
  try {
    const body = (await request.json()) as DraftRequestBody;
    topic = typeof body.topic === "string" ? body.topic.trim() : null;
  } catch {
    return jsonError("VALIDATION_ERROR", "Cuerpo inválido.", 422);
  }
  if (!topic) {
    return jsonError("VALIDATION_ERROR", "Falta el tema.", 422);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError("UNAUTHENTICATED", "No autenticado.", 401);
  }

  let textStream: AsyncIterable<string>;
  try {
    textStream = await chatService.streamDraft(topic);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fallo al redactar.";
    return jsonError("INTERNAL_ERROR", message, 500);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n[Se interrumpió la redacción.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
