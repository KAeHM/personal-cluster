import type { User } from "@/lib/db/schema";
import { shouldBypassPendingClarification } from "@/lib/groups/clarify-response";
import { formatMinutes } from "@/lib/format/time";
import {
  listOpenTaskOptions,
  resolveFinishTarget,
  type OpenTaskOption,
} from "@/lib/tasks/finish-resolve";
import { matchOpenTaskByMessage } from "@/lib/tasks/match-open-task";
import {
  clearPendingFinishSelection,
  finishTask,
  getActivePendingFinishSelection,
  getActiveTask,
  getPausedTasks,
  savePendingFinishSelection,
} from "@/lib/tasks/queries";
import {
  extractFinishTargetHint,
  isFinalizeIntent,
  isGenericFinalizeMessage,
} from "@/lib/whatsapp/finalize-intent";
import {
  buildFinishSelectionReply,
  buildFinishSelectionUnclearReply,
  buildNoOpenTasksToFinishReply,
  buildTaskFinishedReply,
  formatTaskStatusSummary,
  getUserDisplayName,
  type TaskStatusSummary,
} from "@/lib/whatsapp/task-replies";

export type FinalizeTaskResult =
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

function formatOptionLine(option: OpenTaskOption): string {
  const suffix = option.groupLabel ? ` [${option.groupLabel}]` : "";
  const statusLabel =
    option.task.status === "active" ? "em andamento" : "pausada";
  return `• *${option.task.description}*${suffix} (${statusLabel})`;
}

async function finishAndReply(input: {
  user: User;
  userId: string;
  taskId: string;
  whatsappPushName?: string | null;
}): Promise<string> {
  const { user, userId, taskId, whatsappPushName } = input;
  const displayName = getUserDisplayName(user, whatsappPushName);

  const task = await finishTask(userId, taskId);
  await clearPendingFinishSelection(userId);

  const statusSummary = await getStatusSummary(userId);

  return buildTaskFinishedReply({
    displayName,
    taskDescription: task.description,
    durationFormatted: formatMinutes(task.durationMinutes ?? 0),
    statusSummary,
  });
}

export async function tryHandlePendingFinishSelection(
  user: User,
  messageText: string,
  whatsappPushName?: string | null,
): Promise<FinalizeTaskResult> {
  const pending = await getActivePendingFinishSelection(user.id);
  if (!pending) {
    return { handled: false };
  }

  if (shouldBypassPendingClarification(messageText)) {
    await clearPendingFinishSelection(user.id);
    return { handled: false };
  }

  const options = await listOpenTaskOptions(user.id);
  const displayName = getUserDisplayName(user, whatsappPushName);

  if (options.length === 0) {
    await clearPendingFinishSelection(user.id);
    return {
      handled: true,
      reply: buildNoOpenTasksToFinishReply(displayName),
    };
  }

  const match = matchOpenTaskByMessage(
    messageText,
    options.map((o) => o.task),
  );

  if (!match) {
    return {
      handled: true,
      reply: buildFinishSelectionUnclearReply({
        displayName,
        options: options.map(formatOptionLine),
      }),
    };
  }

  return {
    handled: true,
    reply: await finishAndReply({
      user,
      userId: user.id,
      taskId: match.id,
      whatsappPushName,
    }),
    affectedTaskIds: [match.id],
  };
}

export async function tryHandleFinalizeIntent(
  user: User,
  messageText: string,
  whatsappPushName?: string | null,
): Promise<FinalizeTaskResult> {
  if (!isFinalizeIntent(messageText)) {
    return { handled: false };
  }

  const displayName = getUserDisplayName(user, whatsappPushName);
  const hint = extractFinishTargetHint(messageText);

  const resolved = await resolveFinishTarget({
    userId: user.id,
    descricao: hint ?? undefined,
    preferActiveWhenUnspecified: isGenericFinalizeMessage(messageText),
  });

  if (resolved.status === "none") {
    await clearPendingFinishSelection(user.id);
    return {
      handled: true,
      reply: buildNoOpenTasksToFinishReply(displayName),
    };
  }

  if (resolved.status === "resolved") {
    return {
      handled: true,
      reply: await finishAndReply({
        user,
        userId: user.id,
        taskId: resolved.taskId,
        whatsappPushName,
      }),
      affectedTaskIds: [resolved.taskId],
    };
  }

  await savePendingFinishSelection(user.id);

  return {
    handled: true,
    reply: buildFinishSelectionReply({
      displayName,
      options: resolved.options.map(formatOptionLine),
    }),
  };
}
