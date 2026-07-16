// Registro de Resources MCP (Sesión 5, Fase 5). Los Resources exponen
// información navegable/consultable de ReadHub. Reutilizan los servicios de los
// paquetes compartidos. Ampliar = añadir un módulo y su registro.

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerArticleResources } from "./article.resources";
import { registerPlatformResources } from "./platform.resources";

export function registerResources(server: McpServer): void {
  registerArticleResources(server); // readhub://articulos, readhub://articulo/{id}
  registerPlatformResources(server); // readhub://info, estadisticas, autores, categorias
}
