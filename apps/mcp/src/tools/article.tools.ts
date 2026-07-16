// Tools de consulta de artículos (Sesión 5, Fase 4).
// Reutilizan articleService de @readhub/database — no duplican lógica de negocio.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { articleService } from "@readhub/database/article.service";
import { getContext } from "../context";

export function registerArticleTools(server: McpServer): void {
  server.registerTool(
    "listar_articulos",
    {
      title: "Listar artículos",
      description:
        "Devuelve todos los artículos públicos de ReadHub con su título, resumen, autor, fecha, número de visualizaciones y de 'me gusta'.",
    },
    async () => {
      const { supabase } = getContext();
      const articles = await articleService.getArticles(supabase);
      return {
        content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
      };
    }
  );

  server.registerTool(
    "obtener_articulo",
    {
      title: "Obtener artículo por ID",
      description:
        "Devuelve el detalle de un artículo de ReadHub por su ID (UUID): incluye resumen, autor, comentarios y conteos.",
      inputSchema: {
        id: z.string().describe("Identificador (UUID) del artículo"),
      },
    },
    async ({ id }) => {
      const { supabase } = getContext();
      const article = await articleService.getArticle(supabase, id);
      if (!article) {
        return {
          content: [{ type: "text", text: `No existe un artículo con ID ${id}.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(article, null, 2) }],
      };
    }
  );
}
