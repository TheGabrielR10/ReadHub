"use client";

import Image from "next/image";

import { cn } from "@readhub/shared/utils";

export interface ArticleCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  isHoverable?: boolean;
}

export function ArticleCard({
  className,
  isHoverable = true,
  ...props
}: ArticleCardProps) {
  return (
    <article
      className={cn(
        "group rounded-md border border-border bg-card text-card-foreground shadow-sm transition-all duration-base ease-smooth overflow-hidden",
        isHoverable && "hover:shadow-md hover:border-border/60 cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

export function ArticleCardImage({
  className,
  src,
  alt = "",
}: {
  className?: string;
  src: string;
  alt?: string;
}) {
  return (
    <div className="relative w-full h-48 overflow-hidden bg-muted group-hover:opacity-90 transition-opacity duration-base">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
        className={cn(
          "object-cover group-hover:scale-105 transition-transform duration-base",
          className
        )}
      />
    </div>
  );
}

export function ArticleCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 space-y-3", className)} {...props} />
  );
}

export function ArticleCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props} />
  );
}

export function ArticleCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-display font-bold line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-base",
        className
      )}
      {...props}
    />
  );
}

export function ArticleCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm font-normal text-muted-foreground line-clamp-2 leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export function ArticleCardMeta({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // flex-wrap (en vez de un breakpoint fijo) porque el ancho real de la
        // tarjeta no crece de forma monótona con el viewport: el grid del
        // listado cambia de columnas en los mismos puntos de quiebre, así que
        // el ancho disponible depende del layout, no solo del tamaño de pantalla.
        "flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-border text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function ArticleCardAuthor({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props} />
  );
}
