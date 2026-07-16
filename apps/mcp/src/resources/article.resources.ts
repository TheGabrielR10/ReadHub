// Resources de artículos (Sesión 5, Fase 5).
//   readhub://articulos        -> listado de artículos
//   readhub://articulo/{id}    -> detalle de un artículo (plantilla)
// Reutilizan articleService de @readhub/database.

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

import { articleService } from "@readhub/database/article.service";
import { getContext } from "../context";

const JSON_MIME = "application/json";

export function registerArticleResources(server: McpServer): void {
  server.registerResource(
    "articulos",
    "readhub://articulos",
    {
      title: "Artículos de ReadHub",
      description: "Listado de los artículos públicos con sus metadatos y conteos.",
      mimeType: JSON_MIME,
    },
    async (uri) => {
      const { supabase } = getContext();
      const articles = await articleService.getArticles(supabase);
      return {
        contents: [
          { uri: uri.href, mimeType: JSON_MIME, text: JSON.stringify(articles, null, 2) },
        ],
      };
    }
  );

  server.registerResource(
    "articulo",
    new ResourceTemplate("readhub://articulo/{id}", { list: undefined }),
    {
      title: "Artículo por ID",
      description: "Detalle de un artículo concreto de ReadHub (readhub://articulo/{id}).",
      mimeType: JSON_MIME,
    },
    async (uri, variables) => {
      const { supabase } = getContext();
      const id = String(variables.id);
      const article = await articleService.getArticle(supabase, id);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: JSON_MIME,
            text: article
              ? JSON.stringify(article, null, 2)
              : JSON.stringify({ error: `No existe un artículo con ID ${id}.` }),
          },
        ],
      };
    }
  );
}
