"use client";

// Tarjeta de artículo lista para el listado principal (Flujo 4 / 8.2): conecta
// ArticleCard (design system, sin datos) con un ArticleListItem real y hace
// que toda la tarjeta navegue al detalle del artículo.

import Link from "next/link";
import { Heart, Eye, Calendar } from "lucide-react";

import { formatDate, cn } from "@readhub/shared/utils";
import { useLikes } from "@/hooks/useLikes";
import {
  ArticleCard,
  ArticleCardImage,
  ArticleCardContent,
  ArticleCardHeader,
  ArticleCardTitle,
  ArticleCardDescription,
  ArticleCardMeta,
  ArticleCardAuthor,
} from "@/components/cards/ArticleCard";
import type { ArticleListItem } from "@readhub/types/article";

export interface ArticleGridCardProps {
  article: ArticleListItem;
  currentUserId?: string;
}

export function ArticleGridCard({ article, currentUserId }: ArticleGridCardProps) {
  // "Me gusta" directamente desde la tarjeta (Flujo 8). El botón vive dentro del
  // Link, por eso el onClick corta la propagación/navegación para no abrir el
  // artículo al dar like.
  const { likesCount, hasLiked, toggleLike, loading: likeLoading } = useLikes({
    articleId: article.id,
    userId: currentUserId,
    initialLikesCount: article.likesCount,
    initialHasLiked: article.hasLikedByCurrentUser ?? false,
  });

  return (
    <Link
      href={`/article/${article.id}`}
      aria-label={`Ver artículo: ${article.title}`}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ArticleCard>
        <ArticleCardImage src={article.imageUrl} alt={article.title} />

        <ArticleCardContent>
          <ArticleCardHeader>
            <ArticleCardTitle>{article.title}</ArticleCardTitle>
            {article.summary && (
              <ArticleCardDescription>{article.summary}</ArticleCardDescription>
            )}
          </ArticleCardHeader>

          <ArticleCardMeta>
            {/* min-w evita que el email se comprima a casi nada: si no cabe
                junto a la fecha y los contadores, pasa a su propia línea
                (gracias al flex-wrap del padre) en vez de truncarse en exceso. */}
            <ArticleCardAuthor className="min-w-[120px] flex-1">
              <span className="truncate font-medium text-foreground">
                {article.author.email}
              </span>
            </ArticleCardAuthor>

            <span className="flex shrink-0 items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(article.createdAt)}
            </span>

            <span className="ml-auto flex shrink-0 items-center gap-3">
              <span className="flex items-center gap-1" title="Visualizaciones">
                <Eye className="h-3.5 w-3.5" />
                {article.viewsCount}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (currentUserId) void toggleLike();
                }}
                disabled={!currentUserId || likeLoading}
                aria-pressed={hasLiked}
                aria-label={hasLiked ? "Quitar me gusta" : "Me gusta"}
                title="Me gusta"
                className={cn(
                  "flex items-center gap-1 rounded-sm px-1 transition-colors",
                  hasLiked ? "text-primary" : "hover:text-foreground",
                  !currentUserId && "cursor-default"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", hasLiked && "fill-current")} />
                {likesCount}
              </button>
            </span>
          </ArticleCardMeta>
        </ArticleCardContent>
      </ArticleCard>
    </Link>
  );
}
