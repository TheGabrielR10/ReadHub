"use client";

// ChatAssistant — Sesión 4 (RAG), Prompt 9: widget conversacional flotante.
//
// Integra el asistente en el dashboard sin alterar las pantallas existentes:
// un botón flotante abre un panel de chat que consume el sistema RAG a través
// de useChat (que a su vez habla con /api/v1/rag/chat). No hay lógica de negocio
// aquí ni llamadas directas a Supabase/Claude: solo presentación e interacción.

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";

import { cn } from "@readhub/shared/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/components/chat/ChatMessage";

const SUGGESTIONS = [
  "¿De qué tratan los artículos publicados?",
  "Resume lo que se ha escrito sobre lectura.",
  "¿Qué consejos hay para escribir mejor?",
];

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, loading, sendMessage, requestDraft } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Desplazamiento automático al último mensaje.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const submit = (value: string) => {
    const query = value.trim();
    if (!query || loading) return;
    void sendMessage(query);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <Button
          size="icon-lg"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente de ReadHub"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      )}

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl",
            "inset-x-4 bottom-4 top-20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[600px] sm:w-[400px]"
          )}
          role="dialog"
          aria-label="Asistente de ReadHub"
        >
          {/* Cabecera */}
          <header className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Asistente ReadHub</p>
                <p className="text-xs text-muted-foreground">
                  Responde con base en los artículos
                </p>
              </div>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Pregúntame sobre el contenido publicado en ReadHub.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <ChatMessage key={m.id} message={m} onRequestDraft={requestDraft} />
              ))
            )}
          </div>

          {/* Entrada */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta…"
                rows={1}
                className="min-h-[44px] max-h-32 flex-1 resize-none py-2.5"
              />
              <Button
                size="icon"
                onClick={() => submit(input)}
                disabled={loading || !input.trim()}
                aria-label="Enviar pregunta"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
