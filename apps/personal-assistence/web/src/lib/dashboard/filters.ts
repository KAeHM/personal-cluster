import type {
  DashboardChartGranularity,
  DashboardFilters,
  DashboardPeriod,
} from "@/lib/dashboard/types";

export const CONTEXT_NONE_ID = "none";

const PERIODS: DashboardPeriod[] = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
  "custom",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string | null): string | undefined {
  if (!value || !DATE_RE.test(value)) return undefined;
  return value;
}

function parsePeriod(value: string | null): DashboardPeriod {
  if (value && PERIODS.includes(value as DashboardPeriod)) {
    return value as DashboardPeriod;
  }
  return "month";
}

function parseGranularity(
  value: string | null,
): DashboardChartGranularity | undefined {
  if (value === "hour" || value === "day") {
    return value;
  }
  return undefined;
}

function parseGroupIds(searchParams: URLSearchParams): string[] | undefined {
  const contextsParam = searchParams.get("contexts");
  if (contextsParam) {
    const ids = contextsParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return ids.length > 0 ? [...new Set(ids)] : undefined;
  }

  const legacy = searchParams.get("groupId");
  if (legacy && legacy !== "all") {
    return [legacy];
  }

  return undefined;
}

export function parseDashboardFilters(
  searchParams: URLSearchParams,
): DashboardFilters {
  const period = parsePeriod(searchParams.get("period"));
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const groupIds = parseGroupIds(searchParams);
  const granularity = parseGranularity(searchParams.get("granularity"));
  const search = parseSearch(searchParams.get("q"));
  const page = parsePage(searchParams.get("page"));

  if (period === "custom" && from && to) {
    return { period, from, to, groupIds, granularity, search, page };
  }

  if (period === "custom") {
    return { period: "week", groupIds, granularity, search, page };
  }

  return { period, groupIds, granularity, search, page };
}

function parseSearch(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parsePage(value: string | null): number | undefined {
  if (!value) return undefined;
  const page = Number.parseInt(value, 10);
  if (!Number.isFinite(page) || page < 1) return undefined;
  return page;
}

export function buildDashboardSearchParams(
  filters: DashboardFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.period !== "today") {
    params.set("period", filters.period);
  }

  if (filters.period === "custom" && filters.from && filters.to) {
    params.set("from", filters.from);
    params.set("to", filters.to);
  }

  if (filters.groupIds && filters.groupIds.length > 0) {
    params.set("contexts", filters.groupIds.join(","));
  }

  if (filters.granularity && filters.granularity !== "day") {
    params.set("granularity", filters.granularity);
  }

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  return params;
}

/** Query string com `?` — para URLs de API (`/api/dashboard?...`). */
export function buildDashboardQueryString(filters: DashboardFilters): string {
  const query = buildDashboardSearchParams(filters).toString();
  return query ? `?${query}` : "";
}

/** Path do dashboard com query — para `router.replace`. */
export function buildDashboardHref(
  pathname: string,
  filters: DashboardFilters,
): string {
  const query = buildDashboardSearchParams(filters).toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function countActiveDashboardFilters(filters: DashboardFilters): number {
  let count = 0;

  if (filters.period !== "today") count += 1;
  if (filters.groupIds && filters.groupIds.length > 0) count += 1;
  if (filters.search) count += 1;

  return count;
}

export function normalizeFiltersForApply(
  filters: DashboardFilters,
): DashboardFilters {
  return {
    ...filters,
    page: 1,
    search: filters.search?.trim() || undefined,
  };
}

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Hoje",
  week: "Últimos 7 dias",
  month: "Este mês",
  quarter: "Últimos 3 meses",
  year: "Este ano",
  custom: "Período personalizado",
};

export function formatContextFilterSummary(
  groupIds: string[] | undefined,
  contexts: { id: string; label: string }[],
): string | null {
  if (!groupIds || groupIds.length === 0) return null;

  const labels = groupIds.map((id) => {
    if (id === CONTEXT_NONE_ID) return "Sem contexto";
    return contexts.find((context) => context.id === id)?.label ?? "Contexto";
  });

  if (labels.length <= 2) {
    return labels.join(", ");
  }

  return `${labels.length} contextos`;
}
