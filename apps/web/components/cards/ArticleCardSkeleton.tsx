import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "@/components/cards/ArticleCard";

export function ArticleCardSkeleton() {
  return (
    <ArticleCard isHoverable={false}>
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-4 border-t border-border pt-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </ArticleCard>
  );
}
