import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getActiveTask } from "@/lib/tasks/queries";
import { getLiveTrackedMinutes } from "@/lib/tasks/time-tracking";

export async function getClosedMinutesToday(
  userId: string,
  timezone: string,
): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${tasks.durationMinutes}), 0)::int`,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "closed"),
        sql`(${tasks.endedAt} AT TIME ZONE ${timezone})::date = (now() AT TIME ZONE ${timezone})::date`,
      ),
    );

  return result?.total ?? 0;
}

export async function getClosedMinutesLast7Days(
  userId: string,
  timezone: string,
): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${tasks.durationMinutes}), 0)::int`,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "closed"),
        gte(
          sql`(${tasks.endedAt} AT TIME ZONE ${timezone})::date`,
          sql`(now() AT TIME ZONE ${timezone} - interval '7 days')::date`,
        ),
      ),
    );

  return result?.total ?? 0;
}

export async function getActivePartialMinutes(userId: string): Promise<number> {
  const active = await getActiveTask(userId);
  if (!active) return 0;

  return getLiveTrackedMinutes(active);
}

/** @deprecated */
export async function getOpenTasksPartialMinutes(
  userId: string,
): Promise<number> {
  return getActivePartialMinutes(userId);
}

export async function getTotalMinutesToday(
  userId: string,
  timezone: string,
): Promise<number> {
  const [closed, activePartial] = await Promise.all([
    getClosedMinutesToday(userId, timezone),
    getActivePartialMinutes(userId),
  ]);

  return closed + activePartial;
}

export async function getOpenTasksPartialMinutesInWeek(
  userId: string,
  timezone: string,
): Promise<number> {
  const active = await getActiveTask(userId);
  const now = Date.now();
  const weekAgoMs = now - 7 * 24 * 60 * 60 * 1000;

  let total = 0;

  if (active && active.startedAt.getTime() >= weekAgoMs) {
    total += getLiveTrackedMinutes(active);
  }

  const pausedInWeek = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, userId), eq(tasks.status, "paused")),
  });

  for (const task of pausedInWeek) {
    if (task.startedAt.getTime() >= weekAgoMs) {
      total += task.trackedMinutes ?? 0;
    }
  }

  const [closedWeek] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${tasks.durationMinutes}), 0)::int`,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "closed"),
        gte(
          sql`(${tasks.endedAt} AT TIME ZONE ${timezone})::date`,
          sql`(now() AT TIME ZONE ${timezone} - interval '7 days')::date`,
        ),
      ),
    );

  return total + (closedWeek?.total ?? 0);
}
