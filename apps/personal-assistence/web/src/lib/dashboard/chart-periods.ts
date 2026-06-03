import type { Task } from "@/lib/db/schema";
import type { TaskEventType } from "@/lib/tasks/timeline-types";

export type WorkPeriod = {
  start: Date;
  end: Date;
};

type TaskEventRow = {
  type: TaskEventType;
  occurredAt: Date;
  segmentMinutes: number | null;
};

export function extractWorkPeriods(
  task: Task,
  events: TaskEventRow[],
  now: Date,
): WorkPeriod[] {
  if (events.length > 0) {
    return extractFromEvents(task, events, now);
  }

  return extractFallbackPeriods(task, now);
}

function extractFromEvents(
  task: Task,
  events: TaskEventRow[],
  now: Date,
): WorkPeriod[] {
  const periods: WorkPeriod[] = [];
  let activePeriodStart: Date | null = null;

  for (const event of events) {
    if (event.type === "started" || event.type === "resumed") {
      activePeriodStart = event.occurredAt;
      continue;
    }

    if (
      (event.type === "paused" || event.type === "finished") &&
      activePeriodStart
    ) {
      periods.push({
        start: activePeriodStart,
        end: event.occurredAt,
      });
      activePeriodStart = null;
    }
  }

  if (task.status === "active" && task.activatedAt) {
    const periodStart = activePeriodStart ?? task.activatedAt;
    periods.push({
      start: periodStart,
      end: now,
    });
  }

  return periods;
}

function extractFallbackPeriods(task: Task, now: Date): WorkPeriod[] {
  if (task.status === "active" && task.activatedAt) {
    return [{ start: task.activatedAt, end: now }];
  }

  if ((task.trackedMinutes ?? 0) <= 0) {
    return [];
  }

  const end = task.endedAt ?? now;
  const totalMs = end.getTime() - task.startedAt.getTime();

  if (totalMs <= 0) {
    return [{ start: task.startedAt, end: task.startedAt }];
  }

  const trackedMs = (task.trackedMinutes ?? task.durationMinutes ?? 0) * 60_000;
  const start = new Date(end.getTime() - trackedMs);

  return [{ start, end }];
}
