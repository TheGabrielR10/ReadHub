"use client";

// Sección de comentarios del artículo (Flujo 5 / 8.4 y Flujo 7 / 8.5).
// Toda la lógica pasa por useComments — el componente solo maneja estado de UI.

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { useComments } from "@/hooks/useComments";
import { formatDate } from "@readhub/shared/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CommentForm,
  CommentFormContent,
  CommentFormActions,
} from "@/components/forms/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import {
  CommentItem,
  CommentItemAvatar,
  CommentItemContent,
  CommentItemHeader,
  CommentItemAuthor,
  CommentItemTime,
  CommentItemText,
} from "@/components/comments/CommentItem";

export interface CommentSectionProps {
  articleId: string;
  currentUserId?: string;
}

export function CommentSection({
  articleId,
  currentUserId,
}: CommentSectionProps) {
  const { comments, loading, createComment } = useComments(articleId);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!currentUserId) {
      setFormError("Debes iniciar sesión para comentar.");
      return;
    }
    if (!text.trim()) {
      setFormError("El comentario no puede estar vacío.");
      return;
    }

    setSubmitting(true);
    try {
      // Se agrega a la lista local de inmediato (dentro de useComments), sin
      // recargar la página (Flujo 7).
      await createComment(articleId, currentUserId, text.trim());
      setText("");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No fue posible publicar el comentario."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-display font-bold text-foreground">
        Comentarios{comments.length > 0 && ` (${comments.length})`}
      </h2>

      {currentUserId && (
        <CommentForm onSubmit={handleSubmit}>
          <CommentFormContent>
            <Textarea
              placeholder="Escribe un comentario…"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (formError) setFormError(null);
              }}
              disabled={submitting}
              rows={3}
            />
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </CommentFormContent>
          <CommentFormActions>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Publicando…" : "Comentar"}
            </Button>
          </CommentFormActions>
        </CommentForm>
      )}

      <CommentList isLoading={loading} isEmpty={!loading && comments.length === 0}>
        {comments.map((comment) => (
          <CommentItem key={comment.id}>
            <CommentItemAvatar />
            <CommentItemContent>
              <CommentItemHeader>
                <CommentItemAuthor>{comment.author.email}</CommentItemAuthor>
                <CommentItemTime>{formatDate(comment.createdAt)}</CommentItemTime>
              </CommentItemHeader>
              <CommentItemText>{comment.comment}</CommentItemText>
            </CommentItemContent>
          </CommentItem>
        ))}
      </CommentList>
    </section>
  );
}
