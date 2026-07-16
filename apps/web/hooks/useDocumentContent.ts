"use client";

// Hook para cargar el contenido de texto de un documento público de Storage
// (previsualización de .txt). Consume únicamente storageService — el componente
// visor queda como presentación pura, sin lógica de carga de datos.

import { useEffect, useState } from "react";

import { storageService } from "@readhub/database/storage.service";

export interface UseDocumentContentResult {
  content: string | null;
  loading: boolean;
  error: string | null;
}

export function useDocumentContent(
  url: string | null,
  enabled = true
): UseDocumentContentResult {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled && !!url);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    storageService
      .fetchTextContent(url)
      .then((text) => {
        if (mounted) setContent(text);
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible cargar el documento."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [url, enabled]);

  return { content, loading, error };
}
