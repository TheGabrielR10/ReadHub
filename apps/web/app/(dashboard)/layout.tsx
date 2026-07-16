import { redirect } from "next/navigation";

import { AppNavbar } from "@/components/layout/AppNavbar";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { authServer } from "@readhub/database/auth.server";

// Layout para pantallas protegidas del dashboard (home, upload, article/[id]).
// El middleware ya redirige a /login sin sesión; esta verificación es una
// segunda capa de defensa antes de renderizar contenido protegido.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authServer.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppNavbar user={user} />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      {/* Asistente RAG (Sesión 4): disponible en todo el dashboard. */}
      <ChatAssistant />
    </div>
  );
}
