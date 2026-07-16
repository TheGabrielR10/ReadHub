"use client";

import { cn } from "@readhub/shared/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { CommentListSkeleton } from "@/components/comments/CommentSkeleton";

export interface CommentListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: React.ReactNode;
}

export function CommentList({
  className,
  isLoading,
  isEmpty,
  emptyMessage = "Sé el primero en comentar este artículo.",
  children,
  ...props
}: CommentListProps) {
  if (isLoading) {
    return <CommentListSkeleton />;
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="No hay comentarios aún"
        message={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "divide-y divide-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
