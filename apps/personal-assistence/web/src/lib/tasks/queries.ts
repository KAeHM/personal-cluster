import { and, desc, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  pendingFinishSelections,
  pendingTaskDuplicateClarifications,
  tasks,
  users,
} from "@/lib/db/schema";
import type { Task, TaskEventMetadata } from "@/lib/db/schema";
import { recordTaskEvent } from "@/lib/tasks/events";
import { areTaskDescriptionsSimilar } from "@/lib/tasks/similarity";
import { flushActiveTime, getLiveTrackedMinutes } from "@/lib/tasks/time-tracking";

const PENDING_DUPLICATE_TTL_HOURS = 24;
const PENDING_FINISH_TTL_HOURS = 2;

export async function getOrCreateUserByPhone(phone: string, name?: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ phone, name })
    .returning();

  return created;
}

export async function getOrCreateUserByEmail(email: string, name?: string) {
  const normalizedName = name?.trim() || undefined;
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    if (normalizedName && normalizedName !== existing.name) {
      const [updated] = await db
        .update(users)
        .set({ name: normalizedName })
        .where(eq(users.id, existing.id))
        .returning();

      return updated;
    }

    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      name: normalizedName ?? email.split("@")[0],
    })
    .returning();

  return created;
}

export async function getActiveTask(userId: string): Promise<Task | null> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.userId, userId), eq(tasks.status, "active")),
  });

  return task ?? null;
}

export async function getPausedTasks(userId: string): Promise<Task[]> {
  return db.query.tasks.findMany({
    where: and(eq(tasks.userId, userId), eq(tasks.status, "paused")),
    orderBy: [desc(tasks.startedAt)],
  });
}

export async function getTasksForAgentContext(userId: string): Promise<{
  active: Task | null;
  paused: Task[];
}> {
  const [active, paused] = await Promise.all([
    getActiveTask(userId),
    getPausedTasks(userId),
  ]);

  return { active, paused };
}

/** @deprecated Use getTasksForAgentContext */
export async function getOpenTasks(userId: string): Promise<Task[]> {
  const { active, paused } = await getTasksForAgentContext(userId);
  return active ? [active, ...paused] : paused;
}

export async function pauseTask(
  task: Task,
  now: Date = new Date(),
  metadata?: TaskEventMetadata,
): Promise<Task> {
  if (task.status !== "active") {
    return task;
  }

  const previousTracked = task.trackedMinutes ?? 0;
  const flushed = flushActiveTime(task, now);
  const segmentMinutes = flushed.trackedMinutes - previousTracked;

  const [updated] = await db
    .update(tasks)
    .set({
      status: "paused",
      trackedMinutes: flushed.trackedMinutes,
      activatedAt: null,
      updatedAt: now,
    })
    .where(eq(tasks.id, task.id))
    .returning();

  await recordTaskEvent({
    taskId: task.id,
    userId: task.userId,
    type: "paused",
    occurredAt: now,
    segmentMinutes,
    trackedMinutesAfter: flushed.trackedMinutes,
    metadata,
  });

  return updated;
}

export async function pauseActiveTaskIfAny(
  userId: string,
  now: Date = new Date(),
  metadata?: TaskEventMetadata,
): Promise<Task | null> {
  const active = await getActiveTask(userId);
  if (!active) return null;

  return pauseTask(active, now, metadata);
}

async function activateTaskRecord(
  task: Task,
  now: Date = new Date(),
): Promise<Task> {
  const [updated] = await db
    .update(tasks)
    .set({
      status: "active",
      activatedAt: now,
      updatedAt: now,
    })
    .where(eq(tasks.id, task.id))
    .returning();

  await recordTaskEvent({
    taskId: task.id,
    userId: task.userId,
    type: "resumed",
    occurredAt: now,
    trackedMinutesAfter: task.trackedMinutes ?? 0,
  });

  return updated;
}

export async function resumeTask(
  userId: string,
  taskId: string,
  now: Date = new Date(),
): Promise<{
  task: Task;
  pausedDescription: string | null;
  pausedTaskId: string | null;
}> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
  });

  if (!task) {
    throw new Error("Tarefa não encontrada");
  }

  if (task.status === "closed") {
    throw new Error("Tarefa já finalizada");
  }

  if (task.status === "active") {
    return { task, pausedDescription: null, pausedTaskId: null };
  }

  const pausedActive = await pauseActiveTaskIfAny(userId, now);
  const activated = await activateTaskRecord(task, now);

  return {
    task: activated,
    pausedDescription: pausedActive?.description ?? null,
    pausedTaskId: pausedActive?.id ?? null,
  };
}

export type StartTaskInput = {
  userId: string;
  description: string;
  estimatedMinutes?: number;
  groupId?: string;
};

export type StartTaskResult =
  | {
      status: "started";
      task: Task;
      pausedDescription: string | null;
      pausedTaskId: string | null;
    }
  | {
      status: "needs_duplicate_clarification";
      pausedTask: Task;
      newDescription: string;
    };

export async function findSimilarPausedTask(
  userId: string,
  description: string,
): Promise<Task | null> {
  const paused = await getPausedTasks(userId);

  for (const task of paused) {
    if (areTaskDescriptionsSimilar(description, task.description)) {
      return task;
    }
  }

  return null;
}

export async function savePendingTaskDuplicate(input: {
  userId: string;
  pausedTaskId: string;
  newDescription: string;
  estimatedMinutes?: number;
  groupId?: string;
}): Promise<void> {
  const expiresAt = new Date(
    Date.now() + PENDING_DUPLICATE_TTL_HOURS * 60 * 60 * 1000,
  );

  await db
    .delete(pendingTaskDuplicateClarifications)
    .where(eq(pendingTaskDuplicateClarifications.userId, input.userId));

  await db.insert(pendingTaskDuplicateClarifications).values({
    userId: input.userId,
    pausedTaskId: input.pausedTaskId,
    newDescription: input.newDescription,
    estimatedMinutes: input.estimatedMinutes,
    groupId: input.groupId,
    expiresAt,
  });
}

export async function getActivePendingTaskDuplicate(userId: string) {
  const now = new Date();

  const pending = await db.query.pendingTaskDuplicateClarifications.findFirst({
    where: and(
      eq(pendingTaskDuplicateClarifications.userId, userId),
      gt(pendingTaskDuplicateClarifications.expiresAt, now),
    ),
    with: { pausedTask: true },
  });

  return pending ?? null;
}

export async function clearPendingTaskDuplicate(userId: string): Promise<void> {
  await db
    .delete(pendingTaskDuplicateClarifications)
    .where(eq(pendingTaskDuplicateClarifications.userId, userId));
}

export async function startTask(
  input: StartTaskInput,
  now: Date = new Date(),
): Promise<StartTaskResult> {
  const { userId, description, estimatedMinutes, groupId } = input;

  const similarPaused = await findSimilarPausedTask(userId, description);
  if (similarPaused) {
    return {
      status: "needs_duplicate_clarification",
      pausedTask: similarPaused,
      newDescription: description,
    };
  }

  const pausedActive = await pauseActiveTaskIfAny(userId, now, {
    relatedTaskDescription: description,
  });

  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      description,
      status: "active",
      trackedMinutes: 0,
      activatedAt: now,
      startedAt: now,
      estimatedMinutes,
      groupId,
    })
    .returning();

  await recordTaskEvent({
    taskId: task.id,
    userId,
    type: "started",
    occurredAt: now,
    trackedMinutesAfter: 0,
  });

  return {
    status: "started",
    task,
    pausedDescription: pausedActive?.description ?? null,
    pausedTaskId: pausedActive?.id ?? null,
  };
}

export async function createTaskFromPendingDuplicate(
  userId: string,
  description: string,
  estimatedMinutes?: number,
  groupId?: string,
  now: Date = new Date(),
): Promise<{
  task: Task;
  pausedDescription: string | null;
  pausedTaskId: string | null;
}> {
  const pausedActive = await pauseActiveTaskIfAny(userId, now, {
    relatedTaskDescription: description,
  });

  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      description,
      status: "active",
      trackedMinutes: 0,
      activatedAt: now,
      startedAt: now,
      estimatedMinutes,
      groupId,
    })
    .returning();

  await recordTaskEvent({
    taskId: task.id,
    userId,
    type: "started",
    occurredAt: now,
    trackedMinutesAfter: 0,
  });

  return {
    task,
    pausedDescription: pausedActive?.description ?? null,
    pausedTaskId: pausedActive?.id ?? null,
  };
}

export async function pauseActiveTask(
  userId: string,
  now: Date = new Date(),
): Promise<Task | null> {
  return pauseActiveTaskIfAny(userId, now);
}

export async function finishTask(
  userId: string,
  taskId: string,
  endedAt: Date = new Date(),
): Promise<Task> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
  });

  if (!task) {
    throw new Error("Tarefa não encontrada");
  }

  if (task.status === "closed") {
    throw new Error("Tarefa já finalizada");
  }

  const previousTracked = task.trackedMinutes ?? 0;
  const flushed =
    task.status === "active" ? flushActiveTime(task, endedAt) : null;

  const durationMinutes = flushed
    ? flushed.trackedMinutes
    : (task.trackedMinutes ?? 0);

  const segmentMinutes = flushed
    ? durationMinutes - previousTracked
    : null;

  const [updated] = await db
    .update(tasks)
    .set({
      status: "closed",
      trackedMinutes: durationMinutes,
      activatedAt: null,
      endedAt,
      durationMinutes,
      updatedAt: endedAt,
    })
    .where(eq(tasks.id, taskId))
    .returning();

  await recordTaskEvent({
    taskId: task.id,
    userId: task.userId,
    type: "finished",
    occurredAt: endedAt,
    segmentMinutes,
    trackedMinutesAfter: durationMinutes,
  });

  return updated;
}

export type CloseAllPausedResult = {
  closedCount: number;
  closedDescriptions: string[];
  closedTaskIds: string[];
};

export async function closeAllPausedTasks(
  userId: string,
  now: Date = new Date(),
): Promise<CloseAllPausedResult> {
  const paused = await getPausedTasks(userId);

  if (paused.length === 0) {
    return { closedCount: 0, closedDescriptions: [], closedTaskIds: [] };
  }

  const closedDescriptions: string[] = [];
  const closedTaskIds: string[] = [];

  for (const task of paused) {
    const durationMinutes = task.trackedMinutes ?? 0;

    await db
      .update(tasks)
      .set({
        status: "closed",
        activatedAt: null,
        endedAt: now,
        durationMinutes,
        updatedAt: now,
      })
      .where(eq(tasks.id, task.id));

    await recordTaskEvent({
      taskId: task.id,
      userId: task.userId,
      type: "finished",
      occurredAt: now,
      segmentMinutes: null,
      trackedMinutesAfter: durationMinutes,
      metadata: { note: "Fechada em lote (pausadas)" },
    });

    closedDescriptions.push(task.description);
    closedTaskIds.push(task.id);
  }

  return { closedCount: paused.length, closedDescriptions, closedTaskIds };
}

export async function listTasksByUser(userId: string): Promise<Task[]> {
  return db.query.tasks.findMany({
    where: eq(tasks.userId, userId),
    orderBy: [desc(tasks.startedAt)],
  });
}

export async function savePendingFinishSelection(userId: string): Promise<void> {
  const expiresAt = new Date(
    Date.now() + PENDING_FINISH_TTL_HOURS * 60 * 60 * 1000,
  );

  await db
    .delete(pendingFinishSelections)
    .where(eq(pendingFinishSelections.userId, userId));

  await db.insert(pendingFinishSelections).values({
    userId,
    expiresAt,
  });
}

export async function getActivePendingFinishSelection(userId: string) {
  const now = new Date();

  return (
    (await db.query.pendingFinishSelections.findFirst({
      where: and(
        eq(pendingFinishSelections.userId, userId),
        gt(pendingFinishSelections.expiresAt, now),
      ),
    })) ?? null
  );
}

export async function clearPendingFinishSelection(userId: string): Promise<void> {
  await db
    .delete(pendingFinishSelections)
    .where(eq(pendingFinishSelections.userId, userId));
}

export type CreateManualTimeEntryInput = {
  userId: string;
  description: string;
  startedAt: Date;
  durationMinutes: number;
  groupId?: string;
};

export async function createManualTimeEntry(
  input: CreateManualTimeEntryInput,
): Promise<Task> {
  const { userId, description, startedAt, durationMinutes, groupId } = input;
  const endedAt = new Date(startedAt.getTime() + durationMinutes * 60_000);

  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      description,
      status: "closed",
      trackedMinutes: durationMinutes,
      activatedAt: null,
      startedAt,
      endedAt,
      durationMinutes,
      groupId,
    })
    .returning();

  await recordTaskEvent({
    taskId: task.id,
    userId,
    type: "started",
    occurredAt: startedAt,
    trackedMinutesAfter: 0,
  });

  await recordTaskEvent({
    taskId: task.id,
    userId,
    type: "finished",
    occurredAt: endedAt,
    segmentMinutes: durationMinutes,
    trackedMinutesAfter: durationMinutes,
  });

  return task;
}

export { getLiveTrackedMinutes };
