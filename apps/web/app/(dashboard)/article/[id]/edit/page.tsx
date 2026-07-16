"use client";

// Edición de artículo por su autor (CRUD completo). Reutiliza useArticles
// (fetchArticle / updateArticle) — la actualización dispara el reindexado del
// RAG automáticamente. La RLS del servidor ya restringe UPDATE al autor; aquí
// además se comprueba en la UI y se bloquea el acceso a no-autores.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, FileX } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useArticles } from "@/hooks/useArticles";
import { validateArticleEdit } from "@readhub/shared/validators/article";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArticleSkeleton } from "@/components/articles/ArticleSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArticleUploadForm,
  ArticleUploadFormContent,
  ArticleUploadFormActions,
} from "@/components/forms/ArticleUploadForm";

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { fetchArticle, updateArticle } = useArticles();

  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; content?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.push("/login");
      return;
    }

    let mounted = true;
    fetchArticle(params.id, user.id)
      .then((article) => {
        if (!mounted) return;
        // Sin artículo o no eres el autor => no permitido.
        if (!article || article.author.id !== user.id) {
          setNotAllowed(true);
          setLoading(false);
          return;
        }
        setTitle(article.title);
        setSummary(article.summary ?? "");
        setContent(article.content ?? "");
        setIsPublic(article.isPublic);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setNotAllowed(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, initializing, user?.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const errors = validateArticleEdit({ title, content });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await updateArticle(params.id, {
        title: title.trim(),
        summary: summary.trim() || null,
        content: content.trim(),
        isPublic,
      });
      router.push(`/article/${params.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "No fue posible guardar los cambios."
      );
      setSubmitting(false);
    }
  }

  if (loading) return <ArticleSkeleton />;

  if (notAllowed) {
    return (
      <EmptyState
        icon={FileX}
        title="No puedes editar este artículo"
        message="El artículo no existe o no eres su autor."
        action={
          <Button variant="outline" onClick={() => router.push("/")}>
            Volver al inicio
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Editar artículo" description="Actualiza el contenido de tu artículo." />

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <ArticleUploadForm onSubmit={handleSubmit} className="max-w-none">
        <ArticleUploadFormContent>
          <FormField label="Título" htmlFor="title" required error={fieldErrors.title}>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFieldErrors((p) => ({ ...p, title: undefined }));
              }}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Resumen (opcional)"
            htmlFor="summary"
            description="Una breve vista previa que se muestra en el listado."
          >
            <Textarea
              id="summary"
              className="min-h-[80px]"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={submitting}
            />
          </FormField>

          <FormField label="Contenido" htmlFor="content" required error={fieldErrors.content}>
            <Textarea
              id="content"
              className="min-h-[240px]"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setFieldErrors((p) => ({ ...p, content: undefined }));
              }}
              disabled={submitting}
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={submitting}
            />
            Artículo público (visible para todos)
          </label>
        </ArticleUploadFormContent>

        <ArticleUploadFormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/article/${params.id}`)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </ArticleUploadFormActions>
      </ArticleUploadForm>
    </div>
  );
}
