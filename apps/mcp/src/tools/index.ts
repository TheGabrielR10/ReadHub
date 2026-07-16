// Registro de Tools MCP (Sesión 5, Fase 4). Agrega los módulos de Tools; cada
// grupo reutiliza los servicios de los paquetes compartidos (@readhub/database,
// @readhub/ai) sin duplicar lógica. Ampliar = añadir un nuevo módulo y su registro.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerArticleTools } from "./article.tools";
import { registerSearchTools } from "./search.tools";
import { registerRagTools } from "./rag.tools";
import { registerAnalysisTools } from "./analysis.tools";

export function registerTools(server: McpServer): void {
  registerArticleTools(server); //  listar_articulos, obtener_articulo
  registerSearchTools(server); //   buscar_articulos, buscar_semantica
  registerRagTools(server); //      responder_rag
  registerAnalysisTools(server); // comparar_articulos, extraer_temas, resumen_global,
  //                                documentos_relacionados, contexto_investigacion
}
