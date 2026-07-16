"use client";

// useChat — Sesión 4 (RAG), Prompt 9: lógica del asistente conversacional.
//
// Separa la lógica de la UI: mantiene el historial de la conversación (en memoria
// durante la sesión), envía la consulta al Route Handler /api/v1/rag/chat, lee las
// fuentes de la cabecera y consume el stream del cuerpo mostrando la respuesta de
// forma progresiva. Los componentes solo renderizan este estado.

import { useCallback, useRef, useState } from "react";

import { NO_COVERAGE_SIGNAL, type ChatSource } from "@readhub/types/rag";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  streaming?: boolean;
  error?: boolean;
  noCoverage?: boolean; // ningún artículo cubre el tema -> ofrecer redactar
  topic?: string; // consulta original (para el borrador), cuando noCoverage
  isDraft?: boolean; // este mensaje es un borrador de artículo generado
}

// Decodifica la cabecera X-Rag-Sources (JSON en base64 UTF-8).
function decodeSources(header: string | null): ChatSource[] {
  if (!header) return [];
  try {
    const bytes = Uint8Array.from(atob(header), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as ChatSource[];
  } catch {
    return [];
  }
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const patch = useCallback((id: string, changes: Partial<ChatMessageItem>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...changes } : m))
    );
  }, []);

  const sendMessage = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      const assistantId = newId();
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", content: query },
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);

      try {
        const res = await fetch("/api/v1/rag/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!res.ok || !res.body) {
          patch(assistantId, {
            content:
              "No fue posible obtener una respuesta del asistente. Intenta de nuevo.",
            streaming: false,
            error: true,
          });
          return;
        }

        const sources = decodeSources(res.headers.get("X-Rag-Sources"));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          // Si el modelo emite la señal de "sin cobertura", no la mostramos como
          // texto: mantenemos el indicador de escritura hasta finalizar.
          if (text.trim().startsWith(NO_COVERAGE_SIGNAL)) {
            patch(assistantId, { content: "" });
          } else {
            patch(assistantId, { content: text });
          }
        }

        if (text.trim().startsWith(NO_COVERAGE_SIGNAL)) {
          // No hay artículo del tema: se ofrece redactar uno.
          patch(assistantId, {
            content: "",
            noCoverage: true,
            topic: query,
            streaming: false,
          });
        } else {
          patch(assistantId, { content: text, sources, streaming: false });
        }
      } catch {
        patch(assistantId, {
          content: "Ocurrió un error de conexión con el asistente.",
          streaming: false,
          error: true,
        });
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [patch]
  );

  // Genera un borrador de artículo sobre un tema no cubierto (streaming).
  const requestDraft = useCallback(
    async (topic: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const draftId = newId();
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "user",
          content: `Sí, ayúdame a redactar un artículo sobre: ${topic}`,
        },
        { id: draftId, role: "assistant", content: "", streaming: true, isDraft: true },
      ]);

      try {
        const res = await fetch("/api/v1/rag/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });

        if (!res.ok || !res.body) {
          patch(draftId, {
            content: "No fue posible generar el borrador. Intenta de nuevo.",
            streaming: false,
            isDraft: false,
            error: true,
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          patch(draftId, { content: text });
        }
        patch(draftId, { content: text, streaming: false });
      } catch {
        patch(draftId, {
          content: "Ocurrió un error al generar el borrador.",
          streaming: false,
          isDraft: false,
          error: true,
        });
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [patch]
  );

  const reset = useCallback(() => setMessages([]), []);

  return { messages, loading, sendMessage, requestDraft, reset };
}
