"use client";

import * as React from "react";
import { UploadCloud, FileText, X } from "lucide-react";

import { cn } from "@readhub/shared/utils";

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value"> {
  fileName?: string | null;
  placeholder?: string;
  onClear?: () => void;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    { className, fileName, placeholder = "Selecciona un archivo", onClear, ...props },
    ref
  ) => {
    const inputId = React.useId();

    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-sm border border-dashed border-input bg-background px-4 py-3 transition-all duration-base ease-smooth hover:border-primary/50",
          className
        )}
      >
        <label
          htmlFor={inputId}
          className="flex flex-1 cursor-pointer items-center gap-3 text-sm"
        >
          <UploadCloud className="h-5 w-5 shrink-0 text-muted-foreground" />
          {fileName ? (
            <span className="flex items-center gap-2 truncate font-medium text-foreground">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{fileName}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </label>

        {fileName && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Quitar archivo"
            className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors duration-base hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <input
          id={inputId}
          ref={ref}
          type="file"
          className="sr-only"
          {...props}
        />
      </div>
    );
  }
);
FileInput.displayName = "FileInput";

export { FileInput };
