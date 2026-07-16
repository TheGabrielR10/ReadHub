// Contexto compartido del servidor MCP (Sesión 5, Fase 3).
//
// Crea el cliente de Supabase que se INYECTA en los servicios reutilizados del
// monorepo (patrón DI de ReadHub). Se usa la clave ANÓNIMA a propósito: el MCP
// expone conocimiento público, y así la RLS existente limita la lectura a los
// artículos públicos (la función de búsqueda vectorial es SECURITY INVOKER, por
// lo que también respeta la visibilidad). No se duplica lógica de negocio: el
// MCP solo provee el cliente; toda la lógica vive en @readhub/database y @readhub/ai.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";
import { getEnv } from "./config/env";

export interface ReadHubContext {
  supabase: SupabaseClient<Database>;
}

let cached: ReadHubContext | null = null;

// Perezoso: no se crea (ni se exige el entorno) hasta que una Tool/Resource lo
// necesita, de modo que el servidor puede iniciar sin variables de entorno.
export function getContext(): ReadHubContext {
  if (!cached) {
    const env = getEnv();
    const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    cached = { supabase };
  }
  return cached;
}
