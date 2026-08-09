import * as React from "react";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/common/utils/cn";
import { Badge } from "@/common/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/common/components/ui/card";

type StatCardDelta = {
  value: number;
  trend: "up" | "down";
  label?: string;
};

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  delta?: StatCardDelta;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
};

function StatCard({
  label,
  value,
  delta,
  icon,
  description,
  className,
}: StatCardProps) {
  const DeltaIcon = delta?.trend === "up" ? TrendingUpIcon : TrendingDownIcon;
  const deltaVariant = delta?.trend === "up" ? "success" : "destructive";

  return (
    <Card data-slot="stat-card" className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        {icon && (
          <div className="text-muted-foreground [&_svg]:size-4">{icon}</div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {(delta || description) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {delta && (
              <Badge variant={deltaVariant} className="gap-1">
                <DeltaIcon className="size-3" />
                {delta.value > 0 ? "+" : ""}
                {delta.value}%
              </Badge>
            )}
            {(delta?.label ?? description) && (
              <span className="text-muted-foreground text-xs">
                {delta?.label ?? description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { StatCard, type StatCardDelta, type StatCardProps };
