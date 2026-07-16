"use client";

import { cn } from "@readhub/shared/utils";

export function CommentItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex gap-4 py-4 first:pt-0 last:pb-0",
        className
      )}
      {...props}
    />
  );
}

export function CommentItemAvatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex-shrink-0 h-10 w-10 rounded-full bg-muted",
        className
      )}
      {...props}
    />
  );
}

export function CommentItemContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex-1 space-y-2 min-w-0",
        className
      )}
      {...props}
    />
  );
}

export function CommentItemHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  );
}

export function CommentItemAuthor({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <span
      className={cn(
        "min-w-0 truncate text-sm font-semibold text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function CommentItemTime({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <time
      className={cn(
        "shrink-0 text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function CommentItemText({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm font-normal text-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export function CommentItemActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-2",
        className
      )}
      {...props}
    />
  );
}
