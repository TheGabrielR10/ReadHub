// Resources de plataforma (Sesión 5, Fase 5).
//   readhub://info          -> información general de ReadHub
//   readhub://estadisticas  -> métricas agregadas
//   readhub://autores       -> autores y su número de artículos
//   readhub://categorias    -> (no modeladas en el esquema actual)
// Reutilizan statsService de @readhub/database.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { statsService } from "@readhub/database/stats.service";
import { getContext } from "../context";

const JSON_MIME = "application/json";

function jsonContents(uri: URL, data: unknown) {
  return {
    contents: [{ uri: uri.href, mimeType: JSON_MIME, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerPlatformResources(server: McpServer): void {
  server.registerResource(
    "info",
    "readhub://info",
    {
      title: "Información de ReadHub",
      description: "Descripción general de la plataforma y un resumen de sus métricas.",
      mimeType: JSON_MIME,
    },
    async (uri) => {
      const { supabase } = getContext();
      const stats = await statsService.getPlatformStats(supabase);
      return jsonContents(uri, {
        nombre: "ReadHub",
        descripcion:
          "Plataforma de publicación y lectura de artículos con búsqueda semántica y asistente RAG.",
        estadisticas: stats,
      });
    }
  );

  server.registerResource(
    "estadisticas",
    "readhub://estadisticas",
    {
      title: "Estadísticas de ReadHub",
      description: "Totales de artículos, autores, visualizaciones, 'me gusta' y comentarios.",
      mimeType: JSON_MIME,
    },
    async (uri) => {
      const { supabase } = getContext();
      return jsonContents(uri, await statsService.getPlatformStats(supabase));
    }
  );

  server.registerResource(
    "autores",
    "readhub://autores",
    {
      title: "Autores de ReadHub",
      description: "Autores con contenido publicado y su número de artículos.",
      mimeType: JSON_MIME,
    },
    async (uri) => {
      const { supabase } = getContext();
      return jsonContents(uri, await statsService.getAuthors(supabase));
    }
  );

  server.registerResource(
    "categorias",
    "readhub://categorias",
    {
      title: "Categorías de ReadHub",
      description: "Taxonomía de categorías (no modelada en el esquema actual).",
      mimeType: JSON_MIME,
    },
    async (uri) =>
      jsonContents(uri, {
        categorias: [],
        nota: "El esquema actual de ReadHub no define categorías. Este Resource queda preparado para cuando se incorpore la taxonomía.",
      })
  );
}
