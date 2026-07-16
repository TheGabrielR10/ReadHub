"use client";

import { cn } from "@readhub/shared/utils";

export interface CommentFormProps
  extends React.HTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CommentForm({
  className,
  onSubmit,
  ...props
}: CommentFormProps) {
  return (
    <form
      className={cn(
        "space-y-4 w-full",
        className
      )}
      onSubmit={onSubmit}
      {...props}
    />
  );
}

export function CommentFormContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props} />
  );
}

export function CommentFormActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex gap-2 pt-2 justify-end",
        className
      )}
      {...props}
    />
  );
}
