import { cn } from "@/common/utils/cn";
import { Skeleton } from "@/common/components/ui/skeleton";

function ListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      data-slot="list-skeleton"
      className={cn("space-y-3", className)}
      aria-busy="true"
      aria-label="Carregando lista"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { ListSkeleton };
