// Configuración de entorno del servidor MCP (Sesión 5, Fase 3).
// El proceso MCP recibe las variables desde su lanzador (p. ej. la config de
// Claude Desktop) o desde el entorno. No se acoplan a Next.js.

export interface McpEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  anthropicApiKey?: string;
}

export function getEnv(): McpEnv {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "El servidor MCP requiere SUPABASE_URL y SUPABASE_ANON_KEY en el entorno."
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  };
}
