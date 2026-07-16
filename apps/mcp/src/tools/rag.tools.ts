// Tool del pipeline RAG (Sesión 5, Fase 4).
// Reutiliza chatService de @readhub/ai: recuperación semántica + generación con
// Claude, respondiendo SOLO con el conocimiento de ReadHub y citando fuentes.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { chatService } from "@readhub/ai/chat.service";
import { getContext } from "../context";

export function registerRagTools(server: McpServer): void {
  server.registerTool(
    "responder_rag",
    {
      title: "Responder con RAG",
      description:
        "Responde una pregunta en lenguaje natural usando ÚNICAMENTE el conocimiento de los artículos de ReadHub (Retrieval-Augmented Generation). Devuelve la respuesta y las fuentes citadas.",
      inputSchema: {
        pregunta: z.string().describe("Pregunta a responder con el conocimiento de ReadHub"),
      },
    },
    async ({ pregunta }) => {
      const { supabase } = getContext();
      const { answer, sources } = await chatService.answer(supabase, pregunta);

      const fuentes =
        sources.length > 0
          ? "\n\nFuentes:\n" +
            sources
              .map((s) => `[${s.rank}] ${s.title} (relevancia ${Math.round(s.similarity * 100)}%)`)
              .join("\n")
          : "";

      return {
        content: [{ type: "text", text: `${answer}${fuentes}` }],
      };
    }
  );
}
