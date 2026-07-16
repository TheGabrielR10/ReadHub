// Fábrica del servidor MCP de ReadHub (Sesión 5, Fase 2).
// Crea la instancia de McpServer y delega el registro de Tools, Resources y
// Prompts a módulos dedicados (que se implementarán en fases posteriores). Esta
// separación mantiene el punto de entrada limpio y la estructura fácil de ampliar.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerTools } from "./tools";
import { registerResources } from "./resources";
import { registerPrompts } from "./prompts";

export const SERVER_INFO = {
  name: "readhub-mcp",
  version: "0.1.0",
} as const;

export function createServer(): McpServer {
  const server = new McpServer(SERVER_INFO);

  // Puntos de extensión: hoy son no-ops; cada fase irá poblándolos.
  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
