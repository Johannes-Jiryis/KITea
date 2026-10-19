import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AuthButtonSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Skeleton className="hidden h-4 w-16 sm:block" />
      <Skeleton className="h-7 w-7 rounded-full" />
    </div>
  );
}
