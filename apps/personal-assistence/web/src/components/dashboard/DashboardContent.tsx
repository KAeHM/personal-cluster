"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ExportReportButton } from "@/components/dashboard/ExportReportButton";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateRangeLabel } from "@/lib/dashboard/date-range";
import {
  buildDashboardHref,
  buildDashboardQueryString,
  formatContextFilterSummary,
  parseDashboardFilters,
} from "@/lib/dashboard/filters";
import type {
  DashboardChartGranularity,
  DashboardData,
  DashboardFilters,
} from "@/lib/dashboard/types";

const POLL_INTERVAL_MS = 10_000;

type DashboardContentProps = {
  initialData: DashboardData;
  timezone: string;
};

async function fetchDashboard(filters: DashboardFilters): Promise<DashboardData> {
  const response = await fetch(
    `/api/dashboard${buildDashboardQueryString(filters)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Falha ao carregar dashboard");
  }

  return response.json();
}

function filtersSummary(
  filters: DashboardFilters,
  timezone: string,
  contextLabels: { id: string; label: string }[],
): string {
  const parts: string[] = [formatDateRangeLabel(filters, timezone)];

  const contextSummary = formatContextFilterSummary(
    filters.groupIds,
    contextLabels,
  );
  if (contextSummary) {
    parts.push(contextSummary);
  }

  if (filters.search) {
    parts.push(`descrição: “${filters.search}”`);
  }

  return parts.join(" · ");
}

export function DashboardContent({
  initialData,
  timezone,
}: DashboardContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseDashboardFilters(searchParams),
    [searchParams],
  );

  const [data, setData] = useState<DashboardData>(initialData);
  const [contextLabels, setContextLabels] = useState<
    { id: string; label: string }[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  const filtersKey = JSON.stringify(filters);

  const refresh = useCallback(
    async (nextFilters: DashboardFilters, silent = false) => {
      if (!silent) setIsRefreshing(true);
      setError(null);

      try {
        const nextData = await fetchDashboard(nextFilters);
        setData(nextData);
      } catch {
        setError("Não foi possível atualizar os dados.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadContextLabels() {
      try {
        const response = await fetch("/api/contexts", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          contexts: { id: string; label: string }[];
        };
        if (!cancelled) setContextLabels(payload.contexts);
      } catch {
        // summary falls back to generic labels
      }
    }

    void loadContextLabels();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (filtersKey === JSON.stringify(initialData.filters)) return;
    }
    void refresh(filters);
  }, [filtersKey, filters, refresh, initialData.filters]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh(filters, true);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [filters, refresh]);

  const handleGranularityChange = useCallback(
    (granularity: DashboardChartGranularity) => {
      const next: DashboardFilters = { ...filters, granularity };
      router.replace(buildDashboardHref(pathname, next), { scroll: false });
    },
    [filters, pathname, router],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const next: DashboardFilters = { ...filters, page };
      router.replace(buildDashboardHref(pathname, next), { scroll: false });
    },
    [filters, pathname, router],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Visão consolidada do seu timesheet
            {isRefreshing && (
              <span className="ml-2 inline-flex items-center gap-1 text-primary">
                <Loader2 className="size-3 animate-spin" />
                Atualizando…
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {filtersSummary(filters, timezone, contextLabels)}
          </p>
        </div>
        <ExportReportButton filters={filters} />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <MetricsCards
        todayMinutes={data.todayMinutes}
        periodMinutes={data.periodMinutes}
        activeTasksCount={data.activeTasksCount}
        pausedTasksCount={data.pausedTasksCount}
      />

      <DashboardCharts
        chart={data.chart}
        onGranularityChange={handleGranularityChange}
        isLoading={
          isRefreshing && data.chart.granularity !== filters.granularity
        }
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Tarefas
          </h2>
          <span className="text-xs text-muted-foreground">
            {data.tasks.total}{" "}
            {data.tasks.total === 1 ? "registro" : "registros"}
          </span>
        </div>

        {isRefreshing && data.tasks.items.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <TaskTable
            tasksPage={data.tasks}
            timezone={timezone}
            onPageChange={handlePageChange}
            onTaskChanged={() => void refresh(filters, true)}
          />
        )}
      </div>
    </div>
  );
}
