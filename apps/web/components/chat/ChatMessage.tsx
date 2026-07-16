"use client";

// Burbuja de un mensaje del chat (Sesión 4). Renderiza:
//  - mensajes del usuario y del asistente (texto + fuentes plegables),
//  - la invitación a redactar cuando ningún artículo cubre el tema,
//  - el borrador de artículo generado, con botón "Copiar".

import { memo, useState } from "react";
import { Sparkles, Copy, Check, PenLine } from "lucide-react";

import { cn } from "@readhub/shared/utils";
import { Button } from "@/components/ui/button";
import type { ChatMessageItem } from "@/hooks/useChat";
import { ChatSourceList } from "@/components/chat/ChatSourceList";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Escribiendo">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard no disponible */
        }
      }}
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

interface ChatMessageProps {
  message: ChatMessageItem;
  onRequestDraft: (topic: string) => void;
}

// Memoizado: el streaming reemplaza el array completo de `messages` en cada
// chunk (Sesión 7, auditoría de performance); sin memo, cada burbuja ya
// renderizada se re-renderiza en cada token recibido de una respuesta larga.
export const ChatMessage = memo(function ChatMessage({
  message,
  onRequestDraft,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isEmptyStreaming = message.streaming && message.content.length === 0;

  // Caso 1: no hay artículo del tema -> invitación a redactar.
  if (message.noCoverage) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-lg border border-border bg-secondary/40 px-3 py-3 text-sm">
          <p className="mb-2.5 leading-relaxed text-foreground">
            Aún no hay ningún artículo sobre eso en ReadHub. ¿Te ayudo a redactar
            uno para que seas el primero en publicarlo?
          </p>
          <Button
            size="sm"
            onClick={() => message.topic && onRequestDraft(message.topic)}
          >
            <PenLine className="mr-1.5 h-4 w-4" />
            Sí, ayúdame a redactar
          </Button>
        </div>
      </div>
    );
  }

  // Caso 2: borrador de artículo generado.
  if (message.isDraft) {
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[92%] rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Borrador propuesto
            </span>
            {!message.streaming && message.content && <CopyButton text={message.content} />}
          </div>
          {isEmptyStreaming ? (
            <TypingDots />
          ) : (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-foreground">
              {message.content}
            </p>
          )}
          {!message.streaming && message.content && (
            <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
              Cópialo y publícalo desde <span className="font-medium">Cargar Artículo</span>.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Caso 3: mensaje normal (usuario o respuesta del asistente).
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
          message.error && "bg-destructive/10 text-destructive"
        )}
      >
        {isEmptyStreaming ? (
          <TypingDots />
        ) : (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        {!isUser && !message.streaming && message.sources && (
          <ChatSourceList sources={message.sources} />
        )}
      </div>
    </div>
  );
});
