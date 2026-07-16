// Prompts MCP (Sesión 5, Fase 6). Plantillas de instrucciones reutilizables que
// un cliente MCP puede invocar para interactuar con ReadHub de forma consistente:
// resumir, explicar, comparar, generar preguntas y extraer conceptos.
//
// Inyectan contexto real del artículo (título/resumen/autor) reutilizando
// articleService, y guían al modelo a usar la Tool `obtener_articulo` para el
// texto completo. No ejecutan el LLM: devuelven mensajes listos para enviar.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { articleService } from "@readhub/database/article.service";
import { getContext } from "../context";

async function articleContext(id: string): Promise<string> {
  const { supabase } = getContext();
  const a = await articleService.getArticle(supabase, id);
  if (!a) return `(No se encontró el artículo con ID ${id}.)`;
  return [
    `Título: ${a.title}`,
    `Resumen: ${a.summary ?? "(sin resumen)"}`,
    `Autor: ${a.author.email}`,
    `ID: ${a.id}`,
  ].join("\n");
}

function userMessage(text: string) {
  return { messages: [{ role: "user" as const, content: { type: "text" as const, text } }] };
}

export function registerArticlePrompts(server: McpServer): void {
  server.registerPrompt(
    "resumir_articulo",
    {
      title: "Resumir artículo",
      description: "Resume un artículo de ReadHub por su ID.",
      argsSchema: { id: z.string().describe("ID (UUID) del artículo") },
    },
    async ({ id }) =>
      userMessage(
        `Resume el siguiente artículo de ReadHub en 3-5 puntos clave, en español y de forma concisa.\n\n${await articleContext(id)}\n\nSi necesitas el texto completo, usa la herramienta obtener_articulo con id=${id}.`
      )
  );

  server.registerPrompt(
    "explicar_articulo",
    {
      title: "Explicar artículo",
      description: "Explica un artículo de ReadHub de forma clara y sencilla.",
      argsSchema: { id: z.string().describe("ID (UUID) del artículo") },
    },
    async ({ id }) =>
      userMessage(
        `Explica de forma clara y sencilla, para alguien sin conocimientos previos, de qué trata el siguiente artículo de ReadHub y por qué es relevante.\n\n${await articleContext(id)}\n\nUsa obtener_articulo con id=${id} si necesitas el contenido completo.`
      )
  );

  server.registerPrompt(
    "comparar_articulos",
    {
      title: "Comparar artículos",
      description: "Compara dos artículos de ReadHub por sus IDs.",
      argsSchema: {
        id_a: z.string().describe("ID del primer artículo"),
        id_b: z.string().describe("ID del segundo artículo"),
      },
    },
    async ({ id_a, id_b }) => {
      const [a, b] = await Promise.all([articleContext(id_a), articleContext(id_b)]);
      return userMessage(
        `Compara estos dos artículos de ReadHub: indica similitudes, diferencias y posibles contradicciones.\n\n--- Artículo A ---\n${a}\n\n--- Artículo B ---\n${b}\n\nUsa obtener_articulo si necesitas el texto completo de alguno.`
      );
    }
  );

  server.registerPrompt(
    "generar_preguntas",
    {
      title: "Generar preguntas",
      description: "Genera preguntas de comprensión sobre un artículo de ReadHub.",
      argsSchema: { id: z.string().describe("ID (UUID) del artículo") },
    },
    async ({ id }) =>
      userMessage(
        `Genera 5 preguntas de comprensión (con distintos niveles de dificultad) sobre el siguiente artículo de ReadHub.\n\n${await articleContext(id)}\n\nUsa obtener_articulo con id=${id} para basarte en el contenido completo.`
      )
  );

  server.registerPrompt(
    "extraer_conceptos",
    {
      title: "Extraer conceptos clave",
      description: "Extrae los conceptos clave de un artículo de ReadHub.",
      argsSchema: { id: z.string().describe("ID (UUID) del artículo") },
    },
    async ({ id }) =>
      userMessage(
        `Extrae entre 5 y 10 conceptos o términos clave del siguiente artículo de ReadHub, cada uno con una breve definición según el artículo.\n\n${await articleContext(id)}\n\nUsa obtener_articulo con id=${id} si necesitas el texto completo.`
      )
  );
}
