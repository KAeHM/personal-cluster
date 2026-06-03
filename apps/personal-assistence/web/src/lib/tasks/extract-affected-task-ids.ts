import { isToolOutputSuccess } from "@/lib/whatsapp/task-replies";

type ToolCall = {
  toolName: string;
  output: unknown;
};

function collectUnique(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function readTaskId(output: unknown): string | null {
  if (!isToolOutputSuccess(output)) return null;
  const data = output as Record<string, unknown>;
  return typeof data.taskId === "string" ? data.taskId : null;
}

function readTaskIds(output: unknown): string[] {
  if (!isToolOutputSuccess(output)) return [];
  const data = output as Record<string, unknown>;
  if (!Array.isArray(data.closedTaskIds)) return [];
  return data.closedTaskIds.filter(
    (id): id is string => typeof id === "string",
  );
}

function readPausedTaskId(output: unknown): string | null {
  if (!isToolOutputSuccess(output)) return null;
  const data = output as Record<string, unknown>;
  return typeof data.pausedTaskId === "string" ? data.pausedTaskId : null;
}

export function extractAffectedTaskIdsFromToolCalls(
  toolCalls: ToolCall[],
): string[] {
  const ids: string[] = [];

  for (const call of toolCalls) {
    const taskId = readTaskId(call.output);
    if (taskId) ids.push(taskId);

    const pausedTaskId = readPausedTaskId(call.output);
    if (pausedTaskId) ids.push(pausedTaskId);

    ids.push(...readTaskIds(call.output));
  }

  return collectUnique(ids);
}

export function mergeAffectedTaskIds(
  ...groups: (string[] | undefined)[]
): string[] {
  return collectUnique(groups.flatMap((group) => group ?? []));
}
