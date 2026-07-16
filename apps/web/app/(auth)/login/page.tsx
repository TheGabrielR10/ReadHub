import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthForm } from "@/components/forms/AuthForm";
import { LoadingState } from "@/components/ui/loading-state";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

// Punto de entrada por defecto para usuarios no autenticados (Flujo 1).
// El toggle a "Registrarse" ocurre dentro de AuthForm, sin abandonar la página.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando…" />}>
      <AuthForm initialMode="login" />
    </Suspense>
  );
}
