// Registro de Prompts MCP (Sesión 5, Fase 6). Los Prompts ofrecen instrucciones
// predefinidas para interactuar con ReadHub. Reutilizan los servicios compartidos.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerArticlePrompts } from "./article.prompts";

export function registerPrompts(server: McpServer): void {
  registerArticlePrompts(server);
  // resumir_articulo, explicar_articulo, comparar_articulos,
  // generar_preguntas, extraer_conceptos
}
