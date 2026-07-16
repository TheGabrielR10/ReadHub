"use client";

// Vista del artículo ya cargado. Se monta únicamente cuando `article` existe
// (ver app/(dashboard)/article/[id]/page.tsx), garantizando que useLikes reciba
// sus valores iniciales correctos en su primer render.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Eye, Heart, Pencil, Trash2 } from "lucide-react";

import { formatDate, cn } from "@readhub/shared/utils";
import { useLikes } from "@/hooks/useLikes";
import { useArticles } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import {
  ArticleHeader,
  ArticleTitle,
  ArticleMeta,
  ArticleAuthorInfo,
  ArticleImage,
  ArticleActions,
} from "@/components/articles/ArticleContent";
import { ArticleDocumentViewer } from "@/components/articles/ArticleDocumentViewer";
import { CommentSection } from "@/components/comments/CommentSection";
import type { ArticleDetail } from "@readhub/types/article";

export interface ArticleDetailContentProps {
  article: ArticleDetail;
  currentUserId?: string;
}

export function ArticleDetailContent({
  article,
  currentUserId,
}: ArticleDetailContentProps) {
  const router = useRouter();
  const { deleteArticle } = useArticles();

  // Flujo 8: dar/quitar "me gusta" y actualizar el contador.
  const { likesCount, hasLiked, toggleLike, loading: likeLoading } = useLikes({
    articleId: article.id,
    userId: currentUserId,
    initialLikesCount: article.likesCount,
    initialHasLiked: article.hasLikedByCurrentUser,
  });

  // CRUD del autor: solo el dueño del artículo ve Editar / Eliminar (la RLS ya
  // lo protege en el servidor; esto es la capa de UI).
  const isAuthor = !!currentUserId && currentUserId === article.author.id;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteArticle(article.id);
      router.push("/");
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>

        {isAuthor && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/article/${article.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      <article className="space-y-6">
        <ArticleHeader>
          <ArticleTitle>{article.title}</ArticleTitle>

          <ArticleMeta>
            <ArticleAuthorInfo>
              <span className="font-medium text-foreground">
                {article.author.email}
              </span>
            </ArticleAuthorInfo>

            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(article.createdAt)}
            </span>

            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.viewsCount} visualizaciones
            </span>
          </ArticleMeta>
        </ArticleHeader>

        <ArticleImage src={article.imageUrl} alt={article.title} />

        {/* Cuerpo del artículo (texto propio), si existe. */}
        {article.content && (
          <div className="whitespace-pre-wrap break-words leading-relaxed text-foreground">
            {article.content}
          </div>
        )}

        {/* Documento adjunto (opcional): solo se muestra si hay uno. */}
        {article.documentUrl && (
          <ArticleDocumentViewer documentUrl={article.documentUrl} />
        )}

        <ArticleActions>
          <Button
            type="button"
            variant={hasLiked ? "default" : "outline"}
            onClick={() => toggleLike()}
            disabled={!currentUserId || likeLoading}
            aria-pressed={hasLiked}
          >
            <Heart className={cn("h-4 w-4", hasLiked && "fill-current")} />
            {hasLiked ? "Te gusta" : "Me gusta"} ({likesCount})
          </Button>
        </ArticleActions>
      </article>

      <CommentSection articleId={article.id} currentUserId={currentUserId} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Eliminar este artículo?"
        description="Esta acción no se puede deshacer. Se eliminarán también sus comentarios, me gusta y datos asociados."
        confirmLabel="Eliminar"
        isLoading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
