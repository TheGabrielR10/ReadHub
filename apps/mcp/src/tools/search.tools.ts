// Tools de búsqueda (Sesión 5, Fase 4).
// buscar_articulos = coincidencia de texto (ilike); buscar_semantica = vectorial.
// Reutilizan articleService y vectorSearchService — sin duplicar lógica.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { articleService } from "@readhub/database/article.service";
import { vectorSearchService } from "@readhub/ai/vector-search.service";
import { getContext } from "../context";

export function registerSearchTools(server: McpServer): void {
  server.registerTool(
    "buscar_articulos",
    {
      title: "Buscar artículos (texto)",
      description:
        "Busca artículos de ReadHub por coincidencia de texto en el título o el resumen. Para búsquedas por significado, usa 'buscar_semantica'.",
      inputSchema: {
        consulta: z.string().describe("Texto a buscar en título/resumen"),
      },
    },
    async ({ consulta }) => {
      const { supabase } = getContext();
      const results = await articleService.searchArticles(supabase, consulta);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.registerTool(
    "buscar_semantica",
    {
      title: "Búsqueda semántica",
      description:
        "Recupera los artículos más relevantes para una consulta en lenguaje natural mediante similitud vectorial (embeddings + pgvector). Devuelve título, contenido y puntuación de similitud.",
      inputSchema: {
        consulta: z.string().describe("Consulta en lenguaje natural"),
        limite: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Número máximo de resultados (Top-K), por defecto 5"),
      },
    },
    async ({ consulta, limite }) => {
      const { supabase } = getContext();
      const results = await vectorSearchService.search(supabase, consulta, {
        matchCount: limite ?? 5,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );
}
