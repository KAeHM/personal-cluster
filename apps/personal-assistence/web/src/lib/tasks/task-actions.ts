import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getTaskDetail } from "@/lib/tasks/task-detail";
import type {
  TaskAction,
  TaskDetailResponse,
} from "@/lib/tasks/task-detail-types";
import {
  finishTask,
  pauseTask,
  resumeTask,
} from "@/modules/tasks/application/queries";
import { TASK_ERRORS } from "@/modules/tasks/domain/errors";

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<void> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    columns: { id: true },
  });

  if (!task) {
    throw TASK_ERRORS.create("NOT_FOUND");
  }

  await db.delete(tasks).where(eq(tasks.id, taskId));
}

export async function applyTaskAction(
  userId: string,
  taskId: string,
  action: TaskAction,
  now: Date = new Date(),
): Promise<TaskDetailResponse> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
  });

  if (!task) {
    throw TASK_ERRORS.create("NOT_FOUND");
  }

  switch (action) {
    case "pause": {
      if (task.status === "closed") {
        throw TASK_ERRORS.create("ALREADY_CLOSED");
      }
      if (task.status === "paused") {
        throw TASK_ERRORS.create("ALREADY_PAUSED");
      }
      await pauseTask(task, now);
      break;
    }
    case "resume": {
      await resumeTask(userId, taskId, now);
      break;
    }
    case "finish": {
      await finishTask(userId, taskId, now);
      break;
    }
    default: {
      throw TASK_ERRORS.create("INVALID_ACTION");
    }
  }

  const detail = await getTaskDetail(userId, taskId);

  if (!detail) {
    throw TASK_ERRORS.create("NOT_FOUND");
  }

  return detail;
}
