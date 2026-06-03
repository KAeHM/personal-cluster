"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MAX_HOUR_GRANULARITY_DAYS } from "@/lib/dashboard/constants";
import { formatMinutes } from "@/lib/format/time";
import type {
  DashboardChart,
  DashboardChartGranularity,
} from "@/lib/dashboard/types";

const chartConfig = {
  value: {
    label: "Tempo",
    color: "var(--chart-1)",
  },
};

type DashboardChartsProps = {
  chart: DashboardChart;
  onGranularityChange: (granularity: DashboardChartGranularity) => void;
  isLoading?: boolean;
};

export function DashboardCharts({
  chart,
  onGranularityChange,
  isLoading = false,
}: DashboardChartsProps) {
  const series = useMemo(
    () =>
      chart.points.map((point) => ({
        key: point.key,
        label: point.label,
        minutes: point.minutes,
        value:
          chart.unit === "hours"
            ? Math.round((point.minutes / 60) * 100) / 100
            : Math.round(point.minutes),
      })),
    [chart.points, chart.unit],
  );

  const yAxisFormatter = (value: number) =>
    chart.unit === "hours" ? `${value}h` : `${value}m`;

  const totalLabel =
    chart.unit === "hours"
      ? formatMinutes(
          Math.round(series.reduce((sum, row) => sum + row.minutes, 0)),
        )
      : formatMinutes(series.reduce((sum, row) => sum + row.minutes, 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Gráfico de tempo
          </h2>
          <p className="text-xs text-muted-foreground">
            {chart.unit === "hours"
              ? "Total de horas por dia"
              : "Minutos trabalhados por hora"}
            {" · "}
            {totalLabel} no período
          </p>
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={chart.granularity}
          onValueChange={(value) => {
            if (value === "day" || value === "hour") {
              onGranularityChange(value);
            }
          }}
        >
          <ToggleGroupItem value="day" aria-label="Por dia">
            Dia
          </ToggleGroupItem>
          <ToggleGroupItem
            value="hour"
            aria-label="Por hora"
            disabled={!chart.hourGranularityAllowed}
          >
            Hora
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {!chart.hourGranularityAllowed && (
        <p className="text-xs text-muted-foreground">
          Granularidade por hora disponível apenas para períodos de até{" "}
          {MAX_HOUR_GRANULARITY_DAYS} dias.
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : series.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
          Nenhum tempo registrado neste período.
        </p>
      ) : (
        <ChartContainer
          key={chart.granularity}
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <ComposedChart
            key={`${chart.granularity}-${series.length}`}
            data={series}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="chartAreaFade"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-value)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={chart.granularity === "hour" ? 40 : 24}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={yAxisFormatter}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => {
                    const minutes =
                      (item.payload as { minutes?: number }).minutes ?? 0;
                    return (
                      <span className="font-mono font-medium">
                        {formatMinutes(Math.round(minutes))}
                      </span>
                    );
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill="url(#chartAreaFade)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={
                chart.granularity === "hour"
                  ? false
                  : { r: 3, fill: "var(--color-value)" }
              }
              activeDot={{ r: 4, fill: "var(--color-value)" }}
            />
          </ComposedChart>
        </ChartContainer>
      )}
    </div>
  );
}
