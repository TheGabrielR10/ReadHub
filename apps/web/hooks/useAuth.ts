"use client";

// Hook para gestionar autenticación: login, register, logout, sesión actual.
// Consume únicamente authService — ninguna llamada directa a Supabase aquí.

import { useCallback, useEffect, useState } from "react";

import { authService } from "@readhub/database/auth.service";
import { mapAuthError } from "@readhub/database/supabase/auth-errors";
import type { CurrentUser } from "@readhub/types/user";

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  // Resolución de la sesión persistida al montar (8.1) — distinto de `loading`,
  // que solo indica una acción (login/register/logout) en curso. Mezclarlos
  // haría que, por ejemplo, un botón de logout aparezca deshabilitado antes
  // de que el usuario haga clic, mientras se resuelve la sesión inicial.
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial (persistencia de sesión entre recargas, 8.1) + suscripción
  // a cambios de sesión (login/logout/refresh de token) para mantener `user`
  // sincronizado sin que cada componente tenga que refetchear manualmente.
  useEffect(() => {
    let mounted = true;

    authService
      .getCurrentUser()
      .then((current) => {
        if (mounted) setUser(current);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });

    const unsubscribe = authService.onAuthStateChange((current) => {
      if (mounted) setUser(current);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
    } catch (err) {
      setError(mapAuthError(err, "No fue posible iniciar sesión."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Devuelve si el registro dejó una sesión activa de inmediato
  // (hasSession=true cuando la confirmación por email está desactivada) para
  // que la pantalla decida entre redirigir al home o pedir confirmar el correo.
  const register = useCallback(
    async (
      email: string,
      birth_date: string,
      phone: string,
      password: string
    ): Promise<{ hasSession: boolean }> => {
      setLoading(true);
      setError(null);
      try {
        const data = await authService.register(
          email,
          birth_date,
          phone,
          password
        );
        return { hasSession: !!data.session };
      } catch (err) {
        setError(mapAuthError(err, "No fue posible completar el registro."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(mapAuthError(err, "No fue posible cerrar la sesión."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    isAuthenticated: !!user,
    initializing,
    loading,
    error,
    clearError,
    login,
    register,
    logout,
  };
}
