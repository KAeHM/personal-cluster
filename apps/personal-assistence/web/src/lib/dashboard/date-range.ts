import { TZDate } from "@date-fns/tz";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { DashboardFilters, DashboardPeriod } from "@/lib/dashboard/types";

export type ResolvedDateRange = {
  from: string;
  to: string;
};

export const PERIOD_PRESETS: { period: DashboardPeriod; label: string }[] = [
  { period: "today", label: "Hoje" },
  { period: "week", label: "7 dias" },
  { period: "month", label: "Este mês" },
  { period: "quarter", label: "3 meses" },
  { period: "year", label: "Este ano" },
];

function todayInTimezone(timezone: string): TZDate {
  const now = TZDate.tz(timezone);
  return TZDate.tz(timezone, now.getFullYear(), now.getMonth(), now.getDate());
}

export function isoToDate(iso: string): Date {
  return parse(iso, "yyyy-MM-dd", new Date());
}

/** Converte dia do calendário (sem horário) para ISO `yyyy-MM-dd`. */
export function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPresetDateRange(
  period: DashboardPeriod,
  timezone: string,
): ResolvedDateRange {
  const today = todayInTimezone(timezone);
  const to = format(today, "yyyy-MM-dd");

  switch (period) {
    case "today":
      return { from: to, to };
    case "week": {
      const fromDate = TZDate.tz(timezone, today);
      fromDate.setDate(fromDate.getDate() - 6);
      return { from: format(fromDate, "yyyy-MM-dd"), to };
    }
    case "month": {
      const fromDate = TZDate.tz(
        timezone,
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      return { from: format(fromDate, "yyyy-MM-dd"), to };
    }
    case "quarter": {
      const fromDate = TZDate.tz(timezone, today);
      fromDate.setDate(fromDate.getDate() - 89);
      return { from: format(fromDate, "yyyy-MM-dd"), to };
    }
    case "year": {
      const fromDate = TZDate.tz(timezone, today.getFullYear(), 0, 1);
      return { from: format(fromDate, "yyyy-MM-dd"), to };
    }
    case "custom":
      return { from: to, to };
    default:
      return { from: to, to };
  }
}

export function resolveFilterDateRange(
  filters: DashboardFilters,
  timezone: string,
): ResolvedDateRange {
  if (filters.period === "custom" && filters.from && filters.to) {
    return { from: filters.from, to: filters.to };
  }

  return getPresetDateRange(filters.period, timezone);
}

export function formatDateRangeLabel(
  filters: DashboardFilters,
  timezone: string,
): string {
  const { from, to } = resolveFilterDateRange(filters, timezone);
  const fromDate = isoToDate(from);
  const toDate = isoToDate(to);

  if (from === to) {
    return format(fromDate, "d MMM yyyy", { locale: ptBR });
  }

  const sameYear = fromDate.getFullYear() === toDate.getFullYear();

  if (sameYear) {
    return `${format(fromDate, "d MMM", { locale: ptBR })} – ${format(toDate, "d MMM yyyy", { locale: ptBR })}`;
  }

  return `${format(fromDate, "d MMM yyyy", { locale: ptBR })} – ${format(toDate, "d MMM yyyy", { locale: ptBR })}`;
}

export function filtersToCalendarRange(
  filters: DashboardFilters,
  timezone: string,
): { from: Date; to?: Date } | undefined {
  const { from, to } = resolveFilterDateRange(filters, timezone);
  return { from: isoToDate(from), to: isoToDate(to) };
}
