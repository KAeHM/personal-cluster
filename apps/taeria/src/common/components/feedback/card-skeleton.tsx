import { cn } from "@/common/utils/cn";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";

function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card data-slot="card-skeleton" className={cn(className)}>
      <CardHeader className="gap-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  );
}

export { CardSkeleton };
