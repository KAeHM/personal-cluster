import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { taskEvents, tasks } from "@/lib/db/schema";
import type { Task, TaskEventMetadata } from "@/lib/db/schema";
import { formatMinutes } from "@/lib/format/time";
import { getLiveTrackedMinutes } from "@/lib/tasks/time-tracking";
import type {
  TaskEventType,
  TaskTimelineItem,
  TaskTimelineResponse,
} from "@/lib/tasks/timeline-types";

const EVENT_LABELS: Record<TaskEventType, string> = {
  started: "Tarefa iniciada",
  paused: "Pausada",
  resumed: "Retomada",
  finished: "Finalizada",
};

function formatEventDetail(
  type: TaskEventType,
  segmentMinutes: number | null,
  metadata: TaskEventMetadata | null | undefined,
): string | undefined {
  const parts: string[] = [];

  if (segmentMinutes != null && segmentMinutes > 0) {
    parts.push(`+${formatMinutes(segmentMinutes)} neste trecho`);
  }

  if (metadata?.relatedTaskDescription && type === "paused") {
    parts.push(`ao iniciar «${metadata.relatedTaskDescription}»`);
  }

  if (metadata?.note) {
    parts.push(metadata.note);
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function buildItemsFromEvents(
  events: Array<{
    type: TaskEventType;
    occurredAt: Date;
    segmentMinutes: number | null;
    trackedMinutesAfter: number;
    metadata: TaskEventMetadata | null;
  }>,
  task: Task,
  now: Date,
): TaskTimelineItem[] {
  const items: TaskTimelineItem[] = [];
  let activePeriodStart: Date | null = null;

  for (const event of events) {
    if (event.type === "started" || event.type === "resumed") {
      activePeriodStart = event.occurredAt;
      items.push({
        kind: "event",
        type: event.type,
        occurredAt: event.occurredAt.toISOString(),
        label: EVENT_LABELS[event.type],
        detail: formatEventDetail(event.type, null, event.metadata),
        segmentMinutes: null,
        trackedMinutesAfter: event.trackedMinutesAfter,
      });
      continue;
    }

    if (
      (event.type === "paused" || event.type === "finished") &&
      activePeriodStart
    ) {
      items.push({
        kind: "period",
        startedAt: activePeriodStart.toISOString(),
        endedAt: event.occurredAt.toISOString(),
        minutes: event.segmentMinutes ?? 0,
        isLive: false,
      });
      activePeriodStart = null;
    }

    items.push({
      kind: "event",
      type: event.type,
      occurredAt: event.occurredAt.toISOString(),
      label: EVENT_LABELS[event.type],
      detail: formatEventDetail(
        event.type,
        event.segmentMinutes,
        event.metadata,
      ),
      segmentMinutes: event.segmentMinutes,
      trackedMinutesAfter: event.trackedMinutesAfter,
    });
  }

  if (task.status === "active" && task.activatedAt) {
    const periodStart = activePeriodStart ?? task.activatedAt;
    const liveMinutes = Math.max(
      0,
      getLiveTrackedMinutes(task, now) - (task.trackedMinutes ?? 0),
    );

    items.push({
      kind: "period",
      startedAt: periodStart.toISOString(),
      endedAt: null,
      minutes: liveMinutes,
      isLive: true,
    });
  }

  return items;
}

function buildFallbackTimeline(task: Task, now: Date): TaskTimelineItem[] {
  const items: TaskTimelineItem[] = [
    {
      kind: "event",
      type: "started",
      occurredAt: task.startedAt.toISOString(),
      label: EVENT_LABELS.started,
      segmentMinutes: null,
      trackedMinutesAfter: 0,
    },
  ];

  if (task.status === "active" && task.activatedAt) {
    items.push({
      kind: "period",
      startedAt: task.activatedAt.toISOString(),
      endedAt: null,
      minutes: Math.max(
        0,
        getLiveTrackedMinutes(task, now) - (task.trackedMinutes ?? 0),
      ),
      isLive: true,
    });
  } else if ((task.trackedMinutes ?? 0) > 0) {
    items.push({
      kind: "period",
      startedAt: task.startedAt.toISOString(),
      endedAt: task.endedAt?.toISOString() ?? null,
      minutes: task.trackedMinutes ?? 0,
      isLive: false,
    });
  }

  if (task.status === "closed" && task.endedAt) {
    items.push({
      kind: "event",
      type: "finished",
      occurredAt: task.endedAt.toISOString(),
      label: EVENT_LABELS.finished,
      segmentMinutes: task.durationMinutes,
      trackedMinutesAfter: task.durationMinutes ?? 0,
    });
  }

  return items;
}

export async function getTaskTimeline(
  userId: string,
  taskId: string,
  now: Date = new Date(),
): Promise<TaskTimelineResponse | null> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { group: true },
  });

  if (!task || task.userId !== userId) {
    return null;
  }

  const events = await db.query.taskEvents.findMany({
    where: eq(taskEvents.taskId, taskId),
    orderBy: [asc(taskEvents.occurredAt)],
  });

  const hasEventHistory = events.length > 0;

  const totalWorkedMinutes =
    task.status === "active"
      ? getLiveTrackedMinutes(task, now)
      : task.status === "paused"
        ? (task.trackedMinutes ?? 0)
        : (task.durationMinutes ?? task.trackedMinutes ?? 0);

  const items = hasEventHistory
    ? buildItemsFromEvents(
        events.map((e) => ({
          type: e.type as TaskEventType,
          occurredAt: e.occurredAt,
          segmentMinutes: e.segmentMinutes,
          trackedMinutesAfter: e.trackedMinutesAfter,
          metadata: e.metadata,
        })),
        task,
        now,
      )
    : buildFallbackTimeline(task, now);

  return {
    taskId: task.id,
    description: task.description,
    groupLabel: task.group?.label ?? null,
    status: task.status,
    startedAt: task.startedAt.toISOString(),
    endedAt: task.endedAt?.toISOString() ?? null,
    totalWorkedMinutes,
    hasEventHistory,
    items,
  };
}
