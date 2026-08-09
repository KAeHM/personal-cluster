import { formatMinutes } from "@/lib/format/time";
import { BarChart3, CalendarDays, CircleDot, Pause } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MetricsCardsProps = {
  todayMinutes: number;
  periodMinutes: number;
  activeTasksCount: number;
  pausedTasksCount: number;
};

export function MetricsCards({
  todayMinutes,
  periodMinutes,
  activeTasksCount,
  pausedTasksCount,
}: MetricsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/60 relative overflow-hidden">
        <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Horas hoje
          </CardTitle>
          <CalendarDays className="text-primary size-4" />
        </CardHeader>
        <CardContent>
          <p className="metric-value text-3xl font-semibold">
            {formatMinutes(todayMinutes)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Horas no período
          </CardTitle>
          <BarChart3 className="text-chart-2 size-4" />
        </CardHeader>
        <CardContent>
          <p className="metric-value text-3xl font-semibold">
            {formatMinutes(periodMinutes)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Em andamento
          </CardTitle>
          <CircleDot className="size-4 text-[oklch(0.75_0.15_85)]" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="metric-value text-3xl font-semibold">
              {activeTasksCount}
            </p>
            {activeTasksCount > 0 && (
              <Badge className="bg-[oklch(0.75_0.15_85/0.15)] text-[oklch(0.75_0.15_85)] hover:bg-[oklch(0.75_0.15_85/0.15)]">
                Ativa
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Pausadas
          </CardTitle>
          <Pause className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <p className="metric-value text-3xl font-semibold">
            {pausedTasksCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
