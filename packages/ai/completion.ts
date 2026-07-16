import "server-only";

// completion.ts — Punto único de integración con el proveedor de LLM (Claude).
// Encapsula el cliente Anthropic: ningún otro módulo importa @anthropic-ai/sdk
// salvo este. chat.service (RAG) y analysis.service (análisis) lo reutilizan, de
// modo que cambiar de proveedor de LLM afecta solo a este archivo.

import Anthropic from "@anthropic-ai/sdk";

export const LLM_MODEL = "claude-opus-4-8";

let anthropic: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY: configúrala para habilitar las funciones de IA."
    );
  }
  if (!anthropic) anthropic = new Anthropic();
  return anthropic;
}

// Completado no-streaming reutilizable (respuestas, análisis, comparaciones...).
export async function complete(
  system: string,
  user: string,
  maxTokens = 1024
): Promise<string> {
  const message = await getAnthropic().messages.create({
    model: LLM_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}
