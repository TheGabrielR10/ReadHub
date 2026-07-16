// Punto de entrada del servidor MCP de ReadHub (Sesión 5, Fase 2).
// Inicializa el servidor y lo conecta mediante el transporte STDIO (el estándar
// para servidores MCP locales consumidos por clientes como Claude Desktop).
//
// IMPORTANTE: en el transporte STDIO, la salida estándar (stdout) es el canal
// JSON-RPC del protocolo. Cualquier log debe ir SIEMPRE a stderr (console.error),
// nunca a stdout, o se corromperían los mensajes del protocolo.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer, SERVER_INFO } from "./server";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_INFO.name}] servidor MCP iniciado (STDIO) v${SERVER_INFO.version}`);
}

main().catch((error) => {
  console.error("[readhub-mcp] error fatal al iniciar:", error);
  process.exit(1);
});
