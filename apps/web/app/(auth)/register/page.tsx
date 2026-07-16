import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthForm } from "@/components/forms/AuthForm";
import { LoadingState } from "@/components/ui/loading-state";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

// Acceso directo por URL al formulario de registro (Flujo 2). Comparte el
// mismo AuthForm que /login; el toggle entre ambos modos es dinámico.
export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando…" />}>
      <AuthForm initialMode="register" />
    </Suspense>
  );
}
