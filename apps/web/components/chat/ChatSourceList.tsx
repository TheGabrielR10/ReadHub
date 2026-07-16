"use client";

// Panel de fuentes citadas (Sesión 4). Plegable: por defecto muestra solo un
// botón "Fuentes (n)" para no estorbar; al pulsarlo revela los artículos usados
// como contexto, con enlace directo al original.

import { useState } from "react";
import Link from "next/link";
import { FileText, ChevronDown } from "lucide-react";

import { cn } from "@readhub/shared/utils";
import type { ChatSource } from "@readhub/types/rag";

export function ChatSourceList({ sources }: { sources: ChatSource[] }) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 border-t border-border/60 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
        Fuentes ({sources.length})
      </button>

      {open && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {sources.map((source) => (
            <li key={source.articleId}>
              <Link
                href={`/article/${source.articleId}`}
                className="group flex items-center gap-2 rounded-sm px-1.5 py-1 text-xs transition-colors hover:bg-secondary"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {source.rank}
                </span>
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-foreground group-hover:underline">
                  {source.title}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {Math.round(source.similarity * 100)}%
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
