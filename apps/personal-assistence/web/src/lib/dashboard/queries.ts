import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getDashboardChart } from "@/lib/dashboard/chart-series";
import { DASHBOARD_TASKS_PAGE_SIZE } from "@/lib/dashboard/constants";
import { formatDateRangeLabel } from "@/lib/dashboard/date-range";
import {
  groupCondition,
  periodDateCondition,
  searchCondition,
} from "@/lib/dashboard/task-conditions";

import type {
  DashboardData,
  DashboardFilters,
  DashboardTask,
  DashboardTasksPage,
} from "@/lib/dashboard/types";
import { db } from "@/lib/db";
import type { Task } from "@/lib/db/schema";
import { tasks } from "@/lib/db/schema";
import { getTotalMinutesToday } from "@/lib/tasks/metrics";
import { getLiveTrackedMinutes } from "@/lib/tasks/time-tracking";

type TaskWithGroup = Task & {
  group: { id: string; label: string } | null;
};

function toDashboardTask(task: TaskWithGroup): DashboardTask {
  let durationMinutes: number | null;

  if (task.status === "active") {
    durationMinutes = getLiveTrackedMinutes(task);
  } else if (task.status === "paused") {
    durationMinutes = task.trackedMinutes ?? 0;
  } else {
    durationMinutes = task.durationMinutes;
  }

  return {
    id: task.id,
    description: task.description,
    groupId: task.groupId,
    groupLabel: task.group?.label ?? null,
    startedAt: task.startedAt.toISOString(),
    endedAt: task.endedAt?.toISOString() ?? null,
    durationMinutes,
    status: task.status,
  };
}

function buildTaskFilterConditions(
  userId: string,
  timezone: string,
  filters: DashboardFilters,
) {
  return [
    eq(tasks.userId, userId),
    periodDateCondition(timezone, filters),
    groupCondition(filters),
    searchCondition(filters),
  ].filter((condition): condition is NonNullable<typeof condition> =>
    Boolean(condition),
  );
}

export async function listTasksPaginated(
  userId: string,
  timezone: string,
  filters: DashboardFilters,
): Promise<DashboardTasksPage> {
  const conditions = buildTaskFilterConditions(userId, timezone, filters);
  const where = and(...conditions);

  const requestedPage = filters.page ?? 1;
  const pageSize = DASHBOARD_TASKS_PAGE_SIZE;

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(tasks)
    .where(where);

  const total = countRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await db.query.tasks.findMany({
    where,
    with: { group: true },
    orderBy: [desc(tasks.startedAt)],
    limit: pageSize,
    offset,
  });

  return {
    items: rows.map(toDashboardTask),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function listAllTasksForExport(
  userId: string,
  timezone: string,
  filters: DashboardFilters,
): Promise<DashboardTask[]> {
  const conditions = buildTaskFilterConditions(userId, timezone, filters);
  const where = and(...conditions);

  const rows = await db.query.tasks.findMany({
    where,
    with: { group: true },
    orderBy: [desc(tasks.startedAt)],
  });

  return rows.map(toDashboardTask);
}

export async function getReportExportData(
  userId: string,
  timezone: string,
  filters: DashboardFilters,
): Promise<{
  periodLabel: string;
  periodMinutes: number;
  chart: Awaited<ReturnType<typeof getDashboardChart>>;
  tasks: DashboardTask[];
}> {
  const exportFilters: DashboardFilters = {
    ...filters,
    page: undefined,
    granularity: "day",
  };

  const [chart, tasks] = await Promise.all([
    getDashboardChart(userId, timezone, exportFilters, "day"),
    listAllTasksForExport(userId, timezone, exportFilters),
  ]);

  const periodMinutes = chart.points.reduce(
    (total, point) => total + point.minutes,
    0,
  );

  return {
    periodLabel: formatDateRangeLabel(exportFilters, timezone),
    periodMinutes,
    chart,
    tasks,
  };
}

export async function getDashboardData(
  userId: string,
  timezone: string,
  filters: DashboardFilters,
): Promise<DashboardData> {
  const [todayMinutes, taskRows, statusCounts, chart] = await Promise.all([
      getTotalMinutesToday(userId, timezone),
      listTasksPaginated(userId, timezone, filters),
      db
        .select({
          status: tasks.status,
          count: sql<number>`count(*)::int`,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            inArray(tasks.status, ["active", "paused"]),
          ),
        )
        .groupBy(tasks.status),
      getDashboardChart(userId, timezone, filters, filters.granularity),
    ]);

  let activeTasksCount = 0;
  let pausedTasksCount = 0;

  for (const row of statusCounts) {
    if (row.status === "active") activeTasksCount = row.count;
    if (row.status === "paused") pausedTasksCount = row.count;
  }

  const periodMinutes = chart.points.reduce(
    (total, point) => total + point.minutes,
    0,
  );

  return {
    filters: {
      ...filters,
      granularity: chart.granularity,
      page: taskRows.page,
    },
    chart,
    todayMinutes,
    periodMinutes,
    activeTasksCount,
    pausedTasksCount,
    tasks: taskRows,
    fetchedAt: new Date().toISOString(),
  };
}
