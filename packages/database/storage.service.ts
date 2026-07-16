// Service para operaciones en Supabase Storage (documentos e imágenes de portada).
// Recibe el cliente de Supabase por inyección (browser o server) para poder
// usarse tanto desde hooks de cliente como desde Server Components.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";

type Client = SupabaseClient<Database>;

// Buckets creados en la migración 20260706004616_create_storage_buckets_and_policies.
export type StorageBucket = "article-documents" | "article-images";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

// Genera un nombre de objeto único bajo la carpeta del propio usuario
// ({userId}/...), requisito de las políticas RLS de storage.objects que
// solo permiten escribir dentro de la carpeta cuyo nombre es el propio auth.uid().
function buildObjectPath(userId: string, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${userId}/${Date.now()}-${safeName}`;
}

// Los buckets aplican una allowlist estricta de MIME. Algunos navegadores
// reportan un tipo genérico (application/octet-stream, cadena vacía) para
// .txt/.docx, lo que haría rechazar la subida. Inferimos el Content-Type
// correcto desde la extensión para que coincida con la allowlist.
const EXTENSION_MIME: Record<string, string> = {
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// supabase-js sube los Blob/File vía FormData y usa el `.type` del propio
// archivo como Content-Type (la opción `contentType` se ignora para Blobs).
// Por eso, si el navegador reportó un tipo genérico o vacío, re-envolvemos el
// archivo en uno nuevo con el MIME correcto inferido de la extensión; así la
// allowlist de MIME del bucket se satisface de forma fiable.
function withResolvedType(file: File): File {
  const dot = file.name.lastIndexOf(".");
  const ext = dot === -1 ? "" : file.name.slice(dot).toLowerCase();
  const resolved = EXTENSION_MIME[ext];
  if (resolved && resolved !== file.type) {
    return new File([file], file.name, { type: resolved });
  }
  return file;
}

export const storageService = {
  uploadDocument: async (
    client: Client,
    userId: string,
    file: File
  ): Promise<UploadResult> => {
    const path = buildObjectPath(userId, file);
    const { error } = await client.storage
      .from("article-documents")
      .upload(path, withResolvedType(file), {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    return {
      path,
      publicUrl: storageService.getPublicUrl(client, "article-documents", path),
    };
  },

  uploadImage: async (
    client: Client,
    userId: string,
    file: File
  ): Promise<UploadResult> => {
    const path = buildObjectPath(userId, file);
    const { error } = await client.storage
      .from("article-images")
      .upload(path, withResolvedType(file), {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    return {
      path,
      publicUrl: storageService.getPublicUrl(client, "article-images", path),
    };
  },

  deleteFile: async (
    client: Client,
    bucket: StorageBucket,
    path: string
  ): Promise<void> => {
    const { error } = await client.storage.from(bucket).remove([path]);
    if (error) throw error;
  },

  // Construcción de URL pública (sin round-trip de red: ambos buckets son públicos).
  getPublicUrl: (client: Client, bucket: StorageBucket, path: string): string => {
    const {
      data: { publicUrl },
    } = client.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  },

  // Lee el contenido de texto de un archivo público de Storage (usado para
  // previsualizar documentos .txt). Es la capa de acceso a datos; el hook
  // useDocumentContent orquesta el estado de carga/error sobre este método.
  fetchTextContent: async (url: string): Promise<string> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No fue posible cargar el documento.");
    return res.text();
  },
};
