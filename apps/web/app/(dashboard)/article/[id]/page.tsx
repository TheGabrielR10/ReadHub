"use client";

// Página de visualización de artículo completo (Flujo 5 / 8.4). Toda la
// información se obtiene desde Supabase a través de useArticles/useComments/
// useLikes (nunca directamente). Registra la visualización automáticamente
// al abrir el artículo.

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileX } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useArticles } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { ArticleSkeleton } from "@/components/articles/ArticleSkeleton";
import { ArticleDetailContent } from "@/components/articles/ArticleDetailContent";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import type { ArticleDetail } from "@readhub/types/article";

export default function ArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { fetchArticle, registerView, error } = useArticles();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const hasRegisteredView = useRef(false);

  useEffect(() => {
    // Espera a conocer al usuario actual: hasLikedByCurrentUser depende de él,
    // y el listado de estado inicial de useLikes solo se resuelve una vez.
    if (initializing) return;

    let mounted = true;
    setNotFound(false);

    fetchArticle(params.id, user?.id)
      .then((data) => {
        if (!mounted) return;

        if (!data) {
          setNotFound(true);
          return;
        }
        setArticle(data);

        // Flujo 5: se registra automáticamente al abrir, una sola vez.
        if (!hasRegisteredView.current && user) {
          hasRegisteredView.current = true;
          registerView(params.id, user.id);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, initializing, user?.id]);

  if (notFound) {
    return (
      <EmptyState
        icon={FileX}
        title="Artículo no encontrado"
        message="El artículo que buscas no existe o ya no está disponible."
        action={
          <Button variant="outline" onClick={() => router.push("/")}>
            Volver al inicio
          </Button>
        }
      />
    );
  }

  if (!article) {
    if (error) {
      return (
        <ErrorState
          title="No fue posible cargar el artículo"
          message={error}
          onRetry={() => router.refresh()}
        />
      );
    }
    return <ArticleSkeleton />;
  }

  return <ArticleDetailContent article={article} currentUserId={user?.id} />;
}
