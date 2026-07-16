"use client";

import { cn } from "@readhub/shared/utils";

export interface ArticleUploadFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ArticleUploadForm({
  className,
  onSubmit,
  ...props
}: ArticleUploadFormProps) {
  return (
    <form
      className={cn(
        "space-y-8 w-full max-w-2xl",
        className
      )}
      onSubmit={onSubmit}
      {...props}
    />
  );
}

export function ArticleUploadFormContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props} />
  );
}

export function ArticleUploadFormGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props} />
  );
}

export function ArticleUploadFormActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end sm:gap-4",
        "[&>button]:w-full sm:[&>button]:w-auto",
        className
      )}
      {...props}
    />
  );
}
