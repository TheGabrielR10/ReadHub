"use client";

// Hook para gestionar la carga de archivos (documento e imagen de portada).
// Consume únicamente storageService — el hook solo instancia el cliente para
// inyectarlo (DI), nunca llama a supabase.storage directamente.

import { useCallback, useMemo, useState } from "react";

import { createClient } from "@readhub/database/supabase/client";
import {
  storageService,
  type UploadResult,
  type StorageBucket,
} from "@readhub/database/storage.service";

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useUpload() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = useCallback(
    async (userId: string, file: File): Promise<UploadResult> => {
      setLoading(true);
      setError(null);
      try {
        return await storageService.uploadDocument(supabase, userId, file);
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible subir el documento."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const uploadImage = useCallback(
    async (userId: string, file: File): Promise<UploadResult> => {
      setLoading(true);
      setError(null);
      try {
        return await storageService.uploadImage(supabase, userId, file);
      } catch (err) {
        setError(toErrorMessage(err, "No fue posible subir la imagen."));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Limpieza de un archivo ya subido (p. ej. si falla el guardado del artículo
  // tras subir documento e imagen, para no dejar objetos huérfanos en Storage).
  const removeFile = useCallback(
    async (bucket: StorageBucket, path: string) => {
      try {
        await storageService.deleteFile(supabase, bucket, path);
      } catch {
        // Best-effort: la limpieza no debe propagar un error al usuario.
      }
    },
    [supabase]
  );

  return {
    uploadDocument,
    uploadImage,
    removeFile,
    loading,
    error,
  };
}
