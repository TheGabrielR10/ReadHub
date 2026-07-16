// Service para operaciones de autenticación exclusivas de Server Components.
// Separado de auth.service.ts porque depende de "next/headers", que no debe
// empaquetarse en el bundle del cliente (usado por Client Components como LogoutButton).

import { createClient as createServerSupabaseClient } from "@readhub/database/supabase/server";
import type { CurrentUser, UserRole } from "@readhub/types/user";

export const authServer = {
  // Usuario autenticado + perfil, para renderizar la navegación protegida.
  getCurrentUser: async (): Promise<CurrentUser | null> => {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>();

    return {
      id: user.id,
      email: user.email ?? "",
      role: profile?.role ?? "reader",
    };
  },
};
