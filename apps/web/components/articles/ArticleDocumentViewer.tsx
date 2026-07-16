"use client";

// Muestra el documento completo del artículo (Flujo 5). El navegador puede
// renderizar TXT y PDF de forma nativa; DOCX no tiene visor nativo sin
// dependencias adicionales (parsers pesados, fuera del alcance del lab), así
// que se ofrece la apertura/descarga directa del archivo original.

import { FileText, Download } from "lucide-react";

import { useDocumentContent } from "@/hooks/useDocumentContent";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

export interface ArticleDocumentViewerProps {
  documentUrl: string;
}

function getExtension(url: string): string {
  const path = url.split("?")[0];
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot).toLowerCase();
}

function getFileName(url: string): string {
  const path = url.split("?")[0];
  const slash = path.lastIndexOf("/");
  const name = slash === -1 ? path : path.slice(slash + 1);
  // storageService antepone "{timestamp}-" al subir; se oculta en la UI.
  return name.replace(/^\d+-/, "");
}

export function ArticleDocumentViewer({
  documentUrl,
}: ArticleDocumentViewerProps) {
  const ext = getExtension(documentUrl);

  if (ext === ".pdf") {
    return (
      <iframe
        src={documentUrl}
        title="Documento del artículo"
        className="h-[400px] w-full rounded-md border border-border sm:h-[500px] md:h-[600px]"
      />
    );
  }

  if (ext === ".txt") {
    return <TextDocumentViewer documentUrl={documentUrl} />;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-muted/20 p-4 sm:p-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FileText className="h-8 w-8 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {getFileName(documentUrl)}
          </p>
          <p className="text-xs text-muted-foreground">
            Este formato no se puede previsualizar en el navegador.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <a href={documentUrl} target="_blank" rel="noopener noreferrer" download>
          <Download className="h-4 w-4" />
          Descargar
        </a>
      </Button>
    </div>
  );
}

// Presentación pura: la carga del texto (fetch + estado) vive en
// useDocumentContent (hook → storageService), no en el componente.
function TextDocumentViewer({ documentUrl }: { documentUrl: string }) {
  const { content, loading, error } = useDocumentContent(documentUrl);

  if (loading) return <LoadingState message="Cargando documento…" />;
  if (error) {
    return <ErrorState title="No fue posible cargar el documento" message={error} />;
  }

  return (
    <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/20 p-4 text-sm leading-relaxed text-foreground sm:max-h-[500px] sm:p-6 md:max-h-[600px]">
      {content}
    </pre>
  );
}
