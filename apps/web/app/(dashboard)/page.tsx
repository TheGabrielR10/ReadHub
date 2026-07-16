"use client";

// Página principal (Flujo 4 / 8.2): listado de artículos consultado desde
// Supabase a través de useArticles (nunca directamente). Presentación pura —
// toda la lógica de obtención de datos vive en el hook/service.

import { useEffect, useState } from "react";
import { BookX } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useArticles } from "@/hooks/useArticles";
import { ArticleGridCard } from "@/components/cards/ArticleGridCard";
import { ArticleCardSkeleton } from "@/components/cards/ArticleCardSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/layout/PageHeader";

export default function HomePage() {
  const { user, initializing } = useAuth();
  const { articles, loading, error, fetchArticles } = useArticles();
  // useArticles.loading arranca en `false` (solo se activa dentro de
  // fetchArticles). Sin este flag, el primer render mostraría "no hay
  // artículos" durante el instante entre montar y que el useEffect dispare
  // el fetch, en vez del skeleton de carga.
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Espera a conocer al usuario para resolver el estado de "me gusta".
    if (initializing) return;
    fetchArticles(user?.id)
      .catch(() => {})
      .finally(() => setInitialized(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing, user?.id]);

  const showSkeleton = !initialized || (loading && articles.length === 0);
  const showEmpty = initialized && !loading && !error && articles.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artículos"
        description="Explora las publicaciones más recientes de la comunidad."
      />

      {showSkeleton && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      )}

      {initialized && !loading && error && (
        <ErrorState
          title="No fue posible cargar los artículos"
          message={error}
          onRetry={() => fetchArticles().catch(() => {})}
        />
      )}

      {showEmpty && (
        <EmptyState
          icon={BookX}
          title="Todavía no hay artículos"
          message="Cuando alguien publique un artículo, aparecerá aquí."
        />
      )}

      {initialized && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleGridCard
              key={article.id}
              article={article}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
