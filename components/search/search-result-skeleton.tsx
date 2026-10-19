import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="hidden shrink-0 gap-4 sm:flex">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
}

export function SearchResultsSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-border/40 py-1">
      {Array.from({ length: count }).map((_, index) => (
        <SearchResultSkeleton key={index} />
      ))}
    </div>
  );
}
