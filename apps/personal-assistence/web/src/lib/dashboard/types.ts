export type DashboardPeriod =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

export type DashboardChartGranularity = "day" | "hour";

export type DashboardFilters = {
  period: DashboardPeriod;
  from?: string;
  to?: string;
  /** IDs de contexto; inclui `"none"` para tarefas sem contexto. Omitido = todos. */
  groupIds?: string[];
  granularity?: DashboardChartGranularity;
  /** Busca parcial na descrição (case insensitive). */
  search?: string;
  page?: number;
};

export type DashboardTasksPage = {
  items: DashboardTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type DashboardChartPoint = {
  key: string;
  label: string;
  minutes: number;
};

export type DashboardChart = {
  granularity: DashboardChartGranularity;
  unit: "hours" | "minutes";
  points: DashboardChartPoint[];
  rangeDays: number;
  hourGranularityAllowed: boolean;
};

export type DashboardTask = {
  id: string;
  description: string;
  groupId: string | null;
  groupLabel: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  status: "active" | "paused" | "closed";
};

export type DashboardData = {
  filters: DashboardFilters;
  chart: DashboardChart;
  todayMinutes: number;
  periodMinutes: number;
  activeTasksCount: number;
  pausedTasksCount: number;
  tasks: DashboardTasksPage;
  fetchedAt: string;
};
