export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

// --- DTO devuelto por comment.service.ts (no es la fila cruda de la BD) ---

export interface CommentWithAuthor {
  id: string;
  articleId: string;
  comment: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
  };
}
