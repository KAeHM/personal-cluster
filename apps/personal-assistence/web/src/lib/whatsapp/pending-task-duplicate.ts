import type { User } from "@/lib/db/schema";
import { mergeAffectedTaskIds } from "@/lib/tasks/extract-affected-task-ids";
import {
  parseClarificationResponse,
  shouldBypassPendingClarification,
} from "@/lib/groups/clarify-response";
import {
  clearPendingTaskDuplicate,
  createTaskFromPendingDuplicate,
  getActivePendingTaskDuplicate,
  getActiveTask,
  getPausedTasks,
  resumeTask,
} from "@/lib/tasks/queries";
import {
  buildDuplicateClarificationUnclearReply,
  buildTaskResumedReply,
  buildTaskStartedReply,
  formatTaskStatusSummary,
  getUserDisplayName,
  type TaskStatusSummary,
} from "@/lib/whatsapp/task-replies";

export type PendingTaskDuplicateResult =
  | { handled: true; reply: string; affectedTaskIds?: string[] }
  | { handled: false };

async function getStatusSummary(userId: string): Promise<TaskStatusSummary> {
  const [active, paused] = await Promise.all([
    getActiveTask(userId),
    getPausedTasks(userId),
  ]);

  return {
    hasActive: active !== null,
    pausedCount: paused.length,
  };
}

export async function tryHandlePendingTaskDuplicate(
  user: User,
  messageText: string,
  whatsappPushName?: string | null,
): Promise<PendingTaskDuplicateResult> {
  const pending = await getActivePendingTaskDuplicate(user.id);
  if (!pending) {
    return { handled: false };
  }

  if (shouldBypassPendingClarification(messageText)) {
    await clearPendingTaskDuplicate(user.id);
    return { handled: false };
  }

  const answer = parseClarificationResponse(messageText);
  const displayName = getUserDisplayName(user, whatsappPushName);

  if (answer === "unclear") {
    return {
      handled: true,
      reply: buildDuplicateClarificationUnclearReply({
        displayName,
        newDescription: pending.newDescription,
        pausedDescription:
          pending.pausedTask?.description ?? "tarefa pausada",
      }),
    };
  }

  if (answer === "yes") {
    const { task, pausedDescription, pausedTaskId } = await resumeTask(
      user.id,
      pending.pausedTaskId,
    );
    await clearPendingTaskDuplicate(user.id);

    const statusSummary = await getStatusSummary(user.id);

    return {
      handled: true,
      reply: buildTaskResumedReply({
        displayName,
        taskDescription: task.description,
        pausedDescription,
        statusSummary,
      }),
      affectedTaskIds: mergeAffectedTaskIds(
        [task.id],
        pausedTaskId ? [pausedTaskId] : undefined,
      ),
    };
  }

  const { task, pausedDescription, pausedTaskId } =
    await createTaskFromPendingDuplicate(
    user.id,
    pending.newDescription,
    pending.estimatedMinutes ?? undefined,
    pending.groupId ?? undefined,
  );
  await clearPendingTaskDuplicate(user.id);

  const statusSummary = await getStatusSummary(user.id);

  return {
    handled: true,
    reply: buildTaskStartedReply({
      displayName,
      taskDescription: task.description,
      pausedDescription,
      statusSummary,
    }),
    affectedTaskIds: mergeAffectedTaskIds(
      [task.id],
      pausedTaskId ? [pausedTaskId] : undefined,
    ),
  };
}
