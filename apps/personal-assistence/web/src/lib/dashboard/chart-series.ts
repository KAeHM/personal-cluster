import { TZDate } from "@date-fns/tz";
import { addDays, addHours, differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, asc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import { extractWorkPeriods } from "@/lib/dashboard/chart-periods";
import { MAX_HOUR_GRANULARITY_DAYS } from "@/lib/dashboard/constants";
import { isoToDate, resolveFilterDateRange } from "@/lib/dashboard/date-range";
import {
  groupCondition,
  searchCondition,
} from "@/lib/dashboard/task-conditions";
import type {
  DashboardChart,
  DashboardChartGranularity,
  DashboardFilters,
} from "@/lib/dashboard/types";
import { db } from "@/lib/db";
import { taskEvents, tasks } from "@/lib/db/schema";
import type { Task } from "@/lib/db/schema";
import type { TaskEventType } from "@/lib/tasks/timeline-types";

// groupCondition e searchCondition vêm de task-conditions.ts (não redefinir aqui).

export function countRangeDays(from: string, to: string): number {
  return differenceInCalendarDays(isoToDate(to), isoToDate(from)) + 1;
}

export function isHourGranularityAllowed(from: string, to: string): boolean {
  return countRangeDays(from, to) <= MAX_HOUR_GRANULARITY_DAYS;
}

export function resolveChartGranularity(
  requested: DashboardChartGranularity | undefined,
  from: string,
  to: string,
): DashboardChartGranularity {
  if (requested === "hour" && isHourGranularityAllowed(from, to)) {
    return "hour";
  }
  return "day";
}

function rangeBounds(
  from: string,
  to: string,
  timezone: string,
): { start: Date; end: Date } {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);

  const start = TZDate.tz(
    timezone,
    fromYear,
    fromMonth - 1,
    fromDay,
    0,
    0,
    0,
    0,
  );
  const end = TZDate.tz(timezone, toYear, toMonth - 1, toDay, 23, 59, 59, 999);

  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}

function formatBucketKey(
  date: Date,
  granularity: DashboardChartGranularity,
  timezone: string,
): string {
  return format(
    TZDate.tz(timezone, date),
    granularity === "day" ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH",
  );
}

function getBucketEnd(
  date: Date,
  granularity: DashboardChartGranularity,
  timezone: string,
): Date {
  const tz = TZDate.tz(timezone, date);
  if (granularity === "day") {
    const end = TZDate.tz(
      timezone,
      tz.getFullYear(),
      tz.getMonth(),
      tz.getDate(),
      23,
      59,
      59,
      999,
    );
    return new Date(end.getTime());
  }

  const end = TZDate.tz(
    timezone,
    tz.getFullYear(),
    tz.getMonth(),
    tz.getDate(),
    tz.getHours(),
    59,
    59,
    999,
  );
  return new Date(end.getTime());
}

function getBucketStartFromKey(
  key: string,
  granularity: DashboardChartGranularity,
  timezone: string,
): Date {
  if (granularity === "day") {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(
      TZDate.tz(timezone, year, month - 1, day, 0, 0, 0, 0).getTime(),
    );
  }

  const [datePart, hourPart] = key.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const hour = Number(hourPart);
  return new Date(
    TZDate.tz(timezone, year, month - 1, day, hour, 0, 0, 0).getTime(),
  );
}

function allocatePeriodToBuckets(
  periodStart: Date,
  periodEnd: Date,
  granularity: DashboardChartGranularity,
  timezone: string,
  rangeStart: Date,
  rangeEnd: Date,
  buckets: Map<string, number>,
) {
  const start = new Date(Math.max(periodStart.getTime(), rangeStart.getTime()));
  const end = new Date(Math.min(periodEnd.getTime(), rangeEnd.getTime()));

  if (end <= start) return;

  let cursor = start;

  while (cursor < end) {
    const key = formatBucketKey(cursor, granularity, timezone);
    const bucketEnd = getBucketEnd(cursor, granularity, timezone);
    const sliceEnd = new Date(Math.min(end.getTime(), bucketEnd.getTime()));
    const minutes = (sliceEnd.getTime() - cursor.getTime()) / 60_000;

    if (minutes > 0) {
      buckets.set(key, (buckets.get(key) ?? 0) + minutes);
    }

    if (sliceEnd >= end) break;

    cursor = new Date(sliceEnd.getTime() + 1);
  }
}

function generateBucketKeys(
  from: string,
  to: string,
  granularity: DashboardChartGranularity,
  timezone: string,
): string[] {
  const { start, end } = rangeBounds(from, to, timezone);
  const keys: string[] = [];
  let cursor = start;

  while (cursor <= end) {
    keys.push(formatBucketKey(cursor, granularity, timezone));
    cursor = granularity === "day" ? addDays(cursor, 1) : addHours(cursor, 1);
  }

  return keys;
}

function formatBucketLabel(
  key: string,
  granularity: DashboardChartGranularity,
  timezone: string,
): string {
  const date = getBucketStartFromKey(key, granularity, timezone);

  if (granularity === "day") {
    return format(date, "d MMM", { locale: ptBR });
  }

  return format(date, "dd/MM HH:mm", { locale: ptBR });
}

async function listTasksOverlappingRange(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
  filters: DashboardFilters,
): Promise<Task[]> {
  const conditions = [
    eq(tasks.userId, userId),
    lte(tasks.startedAt, rangeEnd),
    or(isNull(tasks.endedAt), gte(tasks.endedAt, rangeStart)),
    groupCondition(filters),
    searchCondition(filters),
  ].filter((condition): condition is NonNullable<typeof condition> =>
    Boolean(condition),
  );

  return db.query.tasks.findMany({
    where: and(...conditions),
  });
}

export async function getDashboardChart(
  userId: string,
  timezone: string,
  filters: DashboardFilters,
  requestedGranularity?: DashboardChartGranularity,
  now: Date = new Date(),
): Promise<DashboardChart> {
  const { from, to } = resolveFilterDateRange(filters, timezone);
  const rangeDays = countRangeDays(from, to);
  const hourGranularityAllowed = isHourGranularityAllowed(from, to);
  const granularity = resolveChartGranularity(requestedGranularity, from, to);
  const { start: rangeStart, end: rangeEnd } = rangeBounds(from, to, timezone);

  const taskRows = await listTasksOverlappingRange(
    userId,
    rangeStart,
    rangeEnd,
    filters,
  );

  const taskIds = taskRows.map((task) => task.id);
  const eventsByTask = new Map<
    string,
    Array<{
      type: TaskEventType;
      occurredAt: Date;
      segmentMinutes: number | null;
    }>
  >();

  if (taskIds.length > 0) {
    const events = await db.query.taskEvents.findMany({
      where: and(
        eq(taskEvents.userId, userId),
        inArray(taskEvents.taskId, taskIds),
      ),
      orderBy: [asc(taskEvents.occurredAt)],
    });

    for (const event of events) {
      const list = eventsByTask.get(event.taskId) ?? [];
      list.push({
        type: event.type as TaskEventType,
        occurredAt: event.occurredAt,
        segmentMinutes: event.segmentMinutes,
      });
      eventsByTask.set(event.taskId, list);
    }
  }

  const buckets = new Map<string, number>();

  for (const task of taskRows) {
    const events = eventsByTask.get(task.id) ?? [];
    const periods = extractWorkPeriods(task, events, now);

    for (const period of periods) {
      allocatePeriodToBuckets(
        period.start,
        period.end,
        granularity,
        timezone,
        rangeStart,
        rangeEnd,
        buckets,
      );
    }
  }

  const keys = generateBucketKeys(from, to, granularity, timezone);

  const points = keys.map((key) => {
    const minutes = Math.round(buckets.get(key) ?? 0);
    return {
      key,
      label: formatBucketLabel(key, granularity, timezone),
      minutes,
    };
  });

  return {
    granularity,
    unit: granularity === "day" ? "hours" : "minutes",
    points,
    rangeDays,
    hourGranularityAllowed,
  };
}
