export interface Article {
  id: string;
  author_id: string;
  title: string;
  summary: string | null;
  content: string | null;
  document_path: string | null;
  image_path: string;
  is_public: boolean;
  created_at: string;
}

export interface ArticleView {
  id: string;
  article_id: string;
  user_id: string;
  viewed_at: string;
}

export interface ArticleLike {
  id: string;
  article_id: string;
  user_id: string;
  created_at: string;
}

export interface ArticleFavorite {
  id: string;
  article_id: string;
  user_id: string;
  created_at: string;
}

// --- DTOs devueltos por article.service.ts (no son filas crudas de la BD) ---

import type { CommentWithAuthor } from "@readhub/types/comment";

export interface ArticleAuthor {
  id: string;
  email: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string;
  author: ArticleAuthor;
  createdAt: string;
  viewsCount: number;
  likesCount: number;
  // Estado de "me gusta" del usuario actual (para el botón de like en la tarjeta).
  // Opcional: solo se resuelve cuando getArticles recibe el userId.
  hasLikedByCurrentUser?: boolean;
}

export interface ArticleDetail extends ArticleListItem {
  content: string | null;
  documentUrl: string | null;
  isPublic: boolean;
  hasLikedByCurrentUser: boolean;
  comments: CommentWithAuthor[];
}

export interface CreateArticleInput {
  title: string;
  summary?: string | null;
  content?: string | null;
  documentPath?: string | null;
  imagePath: string;
  isPublic?: boolean;
}

export interface UpdateArticleInput {
  title?: string;
  summary?: string | null;
  content?: string | null;
  isPublic?: boolean;
}
