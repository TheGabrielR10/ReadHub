import Link from "next/link";
import { BookOpen } from "lucide-react";

// Layout para pantallas de autenticación (login, register).
// Punto de entrada obligatorio para usuarios no autenticados: solo
// muestra el logotipo, el nombre del producto y el formulario activo.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/login"
          className="flex flex-col items-center gap-2 text-center"
        >
          <BookOpen className="h-10 w-10 text-primary" />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            ReadHub
          </span>
        </Link>

        <div className="rounded-md border border-border bg-card p-6 shadow-md sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
