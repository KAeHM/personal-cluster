import { mergeAffectedTaskIds } from "@/lib/tasks/extract-affected-task-ids";
import type { User } from "@/lib/db/schema";
import {
  parseClarificationResponse,
  shouldBypassPendingClarification,
} from "@/lib/groups/clarify-response";
import {
  addGroupAlias,
  clearPendingClarification,
  createWorkGroup,
  getActivePendingClarification,
  getWorkGroupForUser,
  touchWorkGroup,
} from "@/lib/groups/queries";
import { buildTaskDescription } from "@/lib/groups/task-description";
import {
  getActiveTask,
  getPausedTasks,
  savePendingTaskDuplicate,
  startTask,
} from "@/lib/tasks/queries";
import {
  buildClarificationUnclearReply,
  buildGroupClarificationReply,
  buildTaskDuplicateClarificationReply,
  buildTaskStartedReply,
  formatTaskStatusSummary,
  getUserDisplayName,
  type TaskStatusSummary,
} from "@/lib/whatsapp/task-replies";

export type PendingClarificationResult =
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

export async function tryHandlePendingGroupClarification(
  user: User,
  messageText: string,
  whatsappPushName?: string | null,
): Promise<PendingClarificationResult> {
  const pending = await getActivePendingClarification(user.id);
  if (!pending || !pending.candidateGroup) {
    return { handled: false };
  }

  if (shouldBypassPendingClarification(messageText)) {
    await clearPendingClarification(user.id);
    return { handled: false };
  }

  const answer = parseClarificationResponse(messageText);
  const displayName = getUserDisplayName(user, whatsappPushName);
  const candidateLabel = pending.candidateGroup.label;
  const suggestedLabel = pending.suggestedLabel;
  const taskDescription = pending.taskDescription;

  if (answer === "unclear") {
    return {
      handled: true,
      reply: buildClarificationUnclearReply({
        displayName,
        suggestedLabel,
        candidateLabel,
        taskDescription,
      }),
    };
  }

  let groupId: string;

  if (answer === "yes") {
    groupId = pending.candidateGroupId;
    await addGroupAlias(groupId, suggestedLabel);
  } else {
    const newGroup = await createWorkGroup(user.id, suggestedLabel);
    groupId = newGroup.id;
  }

  const group = await getWorkGroupForUser(user.id, groupId);
  const finalDescription = buildTaskDescription(
    taskDescription,
    group?.label ?? suggestedLabel,
  );

  const startResult = await startTask({
    userId: user.id,
    description: finalDescription,
    estimatedMinutes: pending.estimatedMinutes ?? undefined,
    groupId,
  });

  if (startResult.status === "needs_duplicate_clarification") {
    await savePendingTaskDuplicate({
      userId: user.id,
      pausedTaskId: startResult.pausedTask.id,
      newDescription: startResult.newDescription,
      estimatedMinutes: pending.estimatedMinutes ?? undefined,
      groupId,
    });
    await clearPendingClarification(user.id);

    return {
      handled: true,
      reply: buildTaskDuplicateClarificationReply({
        displayName,
        newDescription: startResult.newDescription,
        pausedDescription: startResult.pausedTask.description,
      }),
      affectedTaskIds: [startResult.pausedTask.id],
    };
  }

  await touchWorkGroup(groupId);
  await clearPendingClarification(user.id);

  const statusSummary = await getStatusSummary(user.id);

  return {
    handled: true,
    reply: buildTaskStartedReply({
      displayName,
      taskDescription: startResult.task.description,
      pausedDescription: startResult.pausedDescription,
      statusSummary,
    }),
    affectedTaskIds: mergeAffectedTaskIds(
      [startResult.task.id],
      startResult.pausedTaskId ? [startResult.pausedTaskId] : undefined,
    ),
  };
}
