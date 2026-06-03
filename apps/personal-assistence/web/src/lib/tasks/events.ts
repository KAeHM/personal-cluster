import { db } from "@/lib/db";
import {
  taskEvents,
  type TaskEventMetadata,
} from "@/lib/db/schema";
import type { TaskEventType } from "@/lib/tasks/timeline-types";

export type RecordTaskEventInput = {
  taskId: string;
  userId: string;
  type: TaskEventType;
  occurredAt?: Date;
  segmentMinutes?: number | null;
  trackedMinutesAfter: number;
  metadata?: TaskEventMetadata | null;
};

export async function recordTaskEvent(
  input: RecordTaskEventInput,
): Promise<void> {
  await db.insert(taskEvents).values({
    taskId: input.taskId,
    userId: input.userId,
    type: input.type,
    occurredAt: input.occurredAt ?? new Date(),
    segmentMinutes: input.segmentMinutes ?? null,
    trackedMinutesAfter: input.trackedMinutesAfter,
    metadata: input.metadata ?? null,
  });
}
