import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getTaskDetail } from "@/lib/tasks/task-detail";
import type { TaskAction, TaskDetailResponse } from "@/lib/tasks/task-detail-types";
import {
  finishTask,
  pauseTask,
  resumeTask,
} from "@/lib/tasks/queries";

export class TaskActionError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 = 400,
  ) {
    super(message);
    this.name = "TaskActionError";
  }
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<void> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    columns: { id: true },
  });

  if (!task) {
    throw new TaskActionError("Tarefa não encontrada", 404);
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
    throw new TaskActionError("Tarefa não encontrada", 404);
  }

  switch (action) {
    case "pause": {
      if (task.status === "closed") {
        throw new TaskActionError("Tarefa já finalizada");
      }
      if (task.status === "paused") {
        throw new TaskActionError("Tarefa já está pausada");
      }
      await pauseTask(task, now, { note: "Pausada pelo dashboard" });
      break;
    }
    case "resume": {
      if (task.status === "closed") {
        throw new TaskActionError("Tarefa já finalizada");
      }
      if (task.status === "active") {
        throw new TaskActionError("Tarefa já está em andamento");
      }
      await resumeTask(userId, taskId, now);
      break;
    }
    case "finish": {
      if (task.status === "closed") {
        throw new TaskActionError("Tarefa já finalizada");
      }
      await finishTask(userId, taskId, now);
      break;
    }
    default: {
      const _exhaustive: never = action;
      throw new TaskActionError(`Ação inválida: ${_exhaustive}`);
    }
  }

  const detail = await getTaskDetail(userId, taskId, now);
  if (!detail) {
    throw new TaskActionError("Tarefa não encontrada", 404);
  }

  return detail;
}
