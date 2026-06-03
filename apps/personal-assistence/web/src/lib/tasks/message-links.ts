import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { messageLogs, taskMessageLinks, tasks } from "@/lib/db/schema";
import type { TaskLinkedMessage } from "@/lib/tasks/task-detail-types";

export async function linkTasksToMessage(
  messageLogId: string,
  taskIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(taskIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  await db
    .insert(taskMessageLinks)
    .values(
      uniqueIds.map((taskId) => ({
        taskId,
        messageLogId,
      })),
    )
    .onConflictDoNothing({
      target: [taskMessageLinks.taskId, taskMessageLinks.messageLogId],
    });
}

export async function getTaskLinkedMessages(
  userId: string,
  taskId: string,
): Promise<TaskLinkedMessage[]> {
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
    columns: { id: true },
  });

  if (!task) return [];

  const links = await db.query.taskMessageLinks.findMany({
    where: eq(taskMessageLinks.taskId, taskId),
    orderBy: [asc(taskMessageLinks.createdAt)],
    with: {
      messageLog: {
        columns: {
          id: true,
          direction: true,
          content: true,
          createdAt: true,
          userId: true,
        },
      },
    },
  });

  return links
    .filter(
      (link) =>
        link.messageLog.userId === null || link.messageLog.userId === userId,
    )
    .map((link) => ({
      id: link.messageLog.id,
      direction: link.messageLog.direction,
      content: link.messageLog.content,
      createdAt: link.messageLog.createdAt.toISOString(),
    }));
}

export async function filterTaskIdsOwnedByUser(
  userId: string,
  taskIds: string[],
): Promise<string[]> {
  const uniqueIds = [...new Set(taskIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const rows = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, userId), inArray(tasks.id, uniqueIds)),
    columns: { id: true },
  });

  return rows.map((row) => row.id);
}
