// Validaciones puras (sin React ni Supabase) para la publicación de artículos.
// Los límites y tipos permitidos reflejan la configuración de los buckets de
// Storage (migración 20260706004616_create_storage_buckets_and_policies):
//   - article-documents: 10 MB, TXT / PDF / DOCX
//   - article-images:      5 MB, JPEG / PNG / WEBP / GIF

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// Formato del documento requerido por el spec (Flujo 6): TXT, DOCX o PDF.
export const ALLOWED_DOCUMENT_EXTENSIONS = [".txt", ".pdf", ".docx"] as const;
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
] as const;
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export interface ArticleFormFields {
  title: string;
  content: string;
  document: File | null;
  image: File | null;
}

export type ArticleFieldErrors = Partial<
  Record<keyof ArticleFormFields, string>
>;

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function formatSize(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function validateTitle(title: string): string | null {
  if (!title.trim()) return "El título no puede estar vacío.";
  return null;
}

// El documento es OPCIONAL: si no hay archivo, no hay error. Solo se valida el
// formato/tamaño cuando se adjunta uno. Acepta si la extensión O el MIME
// coincide (algunos navegadores reportan un MIME genérico para .txt/.docx).
export function validateDocument(file: File | null): string | null {
  if (!file) return null;

  const ext = getExtension(file.name);
  const extOk = (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
  const mimeOk = (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(
    file.type
  );
  if (!extOk && !mimeOk) {
    return "El documento debe tener formato TXT, DOCX o PDF.";
  }

  if (file.size === 0) return "El documento está vacío.";
  if (file.size > MAX_DOCUMENT_SIZE) {
    return `El documento supera el tamaño máximo de ${formatSize(MAX_DOCUMENT_SIZE)}.`;
  }
  return null;
}

export function validateImage(file: File | null): string | null {
  if (!file) return "Debes seleccionar una imagen de portada.";

  const ext = getExtension(file.name);
  const extOk = (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
  const mimeOk = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
    file.type
  );
  if (!extOk && !mimeOk) {
    return "La imagen debe tener formato JPG, PNG, WEBP o GIF.";
  }

  if (file.size === 0) return "La imagen está vacía.";
  if (file.size > MAX_IMAGE_SIZE) {
    return `La imagen supera el tamaño máximo de ${formatSize(MAX_IMAGE_SIZE)}.`;
  }
  return null;
}

export function validateArticleForm(
  fields: ArticleFormFields
): ArticleFieldErrors {
  const errors: ArticleFieldErrors = {};
  const titleError = validateTitle(fields.title);
  if (titleError) errors.title = titleError;

  const documentError = validateDocument(fields.document);
  if (documentError) errors.document = documentError;

  // Se requiere el contenido de texto O un documento adjunto (al menos uno).
  if (!fields.content.trim() && !fields.document) {
    errors.content = "Escribe el contenido del artículo o adjunta un documento.";
  }

  const imageError = validateImage(fields.image);
  if (imageError) errors.image = imageError;
  return errors;
}

// Validación de los campos editables de un artículo existente (edición): no hay
// archivos, solo texto. Requiere título y contenido.
export interface ArticleEditFields {
  title: string;
  content: string;
}

export function validateArticleEdit(
  fields: ArticleEditFields
): Partial<Record<keyof ArticleEditFields, string>> {
  const errors: Partial<Record<keyof ArticleEditFields, string>> = {};
  const titleError = validateTitle(fields.title);
  if (titleError) errors.title = titleError;
  if (!fields.content.trim()) {
    errors.content = "El contenido no puede estar vacío.";
  }
  return errors;
}

// Atributo `accept` para los inputs de tipo file (mejora la UX del selector).
export const DOCUMENT_ACCEPT = [
  ...ALLOWED_DOCUMENT_EXTENSIONS,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
].join(",");
export const IMAGE_ACCEPT = [
  ...ALLOWED_IMAGE_EXTENSIONS,
  ...ALLOWED_IMAGE_MIME_TYPES,
].join(",");
