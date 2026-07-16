import "server-only";

// Cliente de Supabase con la service_role key. SALTA la RLS, por lo que es de
// uso EXCLUSIVAMENTE server-side (nunca en el navegador). El `import "server-only"`
// garantiza que un import accidental desde el cliente rompa el build.
//
// Uso previsto: operaciones de sistema como la indexación de embeddings
// (services/indexing.service.ts), que deben escribir en article_embeddings sin
// depender de una sesión de usuario.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";

export type AdminClient = SupabaseClient<Database>;

export function createAdminClient(): AdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
