"use client";

// Publicación de artículos (Flujo 6 / 8.3): valida los archivos, sube el
// documento y la imagen a Storage, guarda el artículo y redirige al home.
// Toda la lógica pasa por los hooks (useUpload, useArticles, useAuth) que a su
// vez consumen los services — la página no toca Supabase directamente.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useUpload } from "@/hooks/useUpload";
import { useArticles } from "@/hooks/useArticles";
import {
  validateArticleForm,
  type ArticleFieldErrors,
  DOCUMENT_ACCEPT,
  IMAGE_ACCEPT,
} from "@readhub/shared/validators/article";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileInput } from "@/components/ui/file-input";
import { FormField } from "@/components/forms/FormField";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ArticleUploadForm,
  ArticleUploadFormContent,
  ArticleUploadFormActions,
} from "@/components/forms/ArticleUploadForm";

export default function UploadPage() {
  const router = useRouter();
  const { user, initializing } = useAuth();
  const { uploadDocument, uploadImage, removeFile } = useUpload();
  const { createArticle } = useArticles();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ArticleFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const documentInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function clearFieldError(key: keyof ArticleFieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }

  function handleDocumentChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDocument(event.target.files?.[0] ?? null);
    clearFieldError("document");
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null);
    clearFieldError("image");
  }

  function clearDocument() {
    setDocument(null);
    if (documentInputRef.current) documentInputRef.current.value = "";
  }

  function clearImage() {
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    // Validación previa: si algo falla, el formulario permanece abierto con el
    // mensaje correspondiente (Flujo 6) y no se sube nada.
    const errors = validateArticleForm({ title, content, document, image });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!user) {
      setSubmitError("Tu sesión no está disponible. Vuelve a iniciar sesión.");
      return;
    }

    // La validación garantiza que la imagen no es null y que hay contenido o
    // documento. El documento es opcional.
    const imageFile = image as File;

    setSubmitting(true);
    let uploadedDocPath: string | null = null;
    let uploadedImgPath: string | null = null;
    try {
      let documentPath: string | null = null;
      if (document) {
        const doc = await uploadDocument(user.id, document);
        uploadedDocPath = doc.path;
        documentPath = doc.path;
      }

      const img = await uploadImage(user.id, imageFile);
      uploadedImgPath = img.path;

      await createArticle(user.id, {
        title: title.trim(),
        content: content.trim() || null,
        documentPath,
        imagePath: img.path,
      });

      // Redirige al home; la página principal recarga su listado al montarse,
      // por lo que el nuevo artículo aparece inmediatamente (Flujo 6).
      router.push("/");
      router.refresh();
    } catch (err) {
      // Si ya se subieron archivos pero falló el guardado, se limpian para no
      // dejar objetos huérfanos en Storage.
      if (uploadedDocPath) removeFile("article-documents", uploadedDocPath);
      if (uploadedImgPath) removeFile("article-images", uploadedImgPath);

      setSubmitError(
        err instanceof Error
          ? err.message
          : "No fue posible publicar el artículo. Inténtalo de nuevo."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Publicar un artículo"
        description="Comparte tu documento con la comunidad de ReadHub."
      />

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <ArticleUploadForm onSubmit={handleSubmit} className="max-w-none">
        <ArticleUploadFormContent>
          <FormField
            label="Título"
            htmlFor="title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="title"
              name="title"
              placeholder="Un título descriptivo para tu artículo"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearFieldError("title");
              }}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Contenido"
            htmlFor="content"
            required
            error={fieldErrors.content}
            description="Escribe aquí el cuerpo del artículo. Puedes complementarlo con un documento adjunto."
          >
            <Textarea
              id="content"
              name="content"
              placeholder="Escribe el contenido de tu artículo…"
              className="min-h-[220px]"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                clearFieldError("content");
              }}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Documento (opcional)"
            error={fieldErrors.document}
            description="Adjunta un archivo si lo deseas: TXT, DOCX o PDF (máx. 10 MB)."
          >
            <FileInput
              ref={documentInputRef}
              accept={DOCUMENT_ACCEPT}
              fileName={document?.name ?? null}
              placeholder="Selecciona un documento"
              onChange={handleDocumentChange}
              onClear={clearDocument}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Imagen de portada"
            required
            error={fieldErrors.image}
            description="Formatos permitidos: JPG, PNG, WEBP o GIF (máx. 5 MB)."
          >
            <FileInput
              ref={imageInputRef}
              accept={IMAGE_ACCEPT}
              fileName={image?.name ?? null}
              placeholder="Selecciona una imagen"
              onChange={handleImageChange}
              onClear={clearImage}
              disabled={submitting}
            />
          </FormField>
        </ArticleUploadFormContent>

        <ArticleUploadFormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || initializing}>
            {submitting ? "Publicando…" : "Publicar"}
          </Button>
        </ArticleUploadFormActions>
      </ArticleUploadForm>
    </div>
  );
}
