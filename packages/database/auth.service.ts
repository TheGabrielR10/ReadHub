// Service para operaciones de autenticación desde el navegador (Client Components).
// Para obtener el usuario actual en Server Components/layouts, usar auth.server.ts —
// separado para evitar que "next/headers" se empaquete en el bundle del cliente.

import type { User, SupabaseClient } from "@supabase/supabase-js";

import { createClient as createBrowserClient } from "@readhub/database/supabase/client";
import type { Database } from "@readhub/types/database";
import type { CurrentUser, UserRole } from "@readhub/types/user";

async function resolveCurrentUser(
  client: SupabaseClient<Database>,
  user: User
): Promise<CurrentUser> {
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "reader",
  };
}

export const authService = {
  // Flujo 3: inicio de sesión con email + password.
  login: async (email: string, password: string) => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Flujo 2: registro de usuario. birth_date/phone/role viajan en los
  // metadatos del usuario (raw_user_meta_data); el trigger on_auth_user_created
  // (supabase/migrations/..._create_profile_sync_trigger.sql) los lee de ahí
  // para crear automáticamente la fila en public.profiles.
  register: async (
    email: string,
    birth_date: string,
    phone: string,
    password: string
  ) => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { birth_date, phone, role: "reader" },
      },
    });
    if (error) throw error;
    return data;
  },

  // Cierra la sesión activa desde el cliente (usado por la navegación).
  logout: async () => {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentSession: async () => {
    const supabase = createBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  // Usuario autenticado + perfil, desde el navegador (usado por useAuth).
  getCurrentUser: async (): Promise<CurrentUser | null> => {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;
    return resolveCurrentUser(supabase, user);
  },

  // Persistencia de sesión entre recargas (8.1): notifica a los suscriptores
  // cada vez que Supabase Auth restaura, renueva o cierra la sesión.
  // Devuelve una función de limpieza para cancelar la suscripción.
  onAuthStateChange: (callback: (user: CurrentUser | null) => void) => {
    const supabase = createBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        callback(null);
        return;
      }
      resolveCurrentUser(supabase, session.user).then(callback);
    });

    return () => subscription.unsubscribe();
  },
};
