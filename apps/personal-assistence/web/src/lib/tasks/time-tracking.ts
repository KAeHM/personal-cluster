import type { Task } from "@/lib/db/schema";

export function getPartialActiveMinutes(
  task: Pick<Task, "activatedAt">,
  now: Date = new Date(),
): number {
  if (!task.activatedAt) return 0;

  return Math.max(
    0,
    Math.round((now.getTime() - task.activatedAt.getTime()) / 60_000),
  );
}

export function getLiveTrackedMinutes(
  task: Pick<Task, "status" | "trackedMinutes" | "activatedAt">,
  now: Date = new Date(),
): number {
  const base = task.trackedMinutes ?? 0;

  if (task.status !== "active") {
    return base;
  }

  return base + getPartialActiveMinutes(task, now);
}

export function flushActiveTime(
  task: Pick<Task, "trackedMinutes" | "activatedAt">,
  now: Date = new Date(),
): { trackedMinutes: number; activatedAt: null } {
  const trackedMinutes =
    (task.trackedMinutes ?? 0) + getPartialActiveMinutes(task, now);

  return { trackedMinutes, activatedAt: null };
}
