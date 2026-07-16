"use client";

import Image from "next/image";

import { cn } from "@readhub/shared/utils";

export function ArticleContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:leading-relaxed",
        "prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-muted-foreground prose-em:italic",
        "prose-code:bg-muted prose-code:text-accent prose-code:rounded prose-code:px-1.5",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        "prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:text-muted-foreground",
        "prose-img:rounded-md prose-img:shadow-md",
        "prose-table:border-collapse prose-th:bg-muted prose-th:border prose-th:border-border prose-td:border prose-td:border-border prose-td:p-2",
        "prose-hr:border-border",
        className
      )}
      {...props}
    />
  );
}

export function ArticleHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "space-y-4 border-b border-border pb-6 mb-6",
        className
      )}
      {...props}
    />
  );
}

export function ArticleTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function ArticleMeta({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function ArticleAuthorInfo({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        className
      )}
      {...props}
    />
  );
}

export function ArticleImage({
  className,
  src,
  alt = "",
}: {
  className?: string;
  src: string;
  alt?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full h-56 sm:h-72 md:h-96 rounded-md shadow-md my-6 sm:my-8 overflow-hidden",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 768px, 100vw"
        className="object-cover"
      />
    </div>
  );
}

export function ArticleActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 py-6 border-y border-border",
        className
      )}
      {...props}
    />
  );
}
