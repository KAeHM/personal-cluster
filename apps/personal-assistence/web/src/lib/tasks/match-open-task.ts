import type { Task } from "@/lib/db/schema";
import { normalizeGroupKey } from "@/lib/groups/normalize";
import { areTaskDescriptionsSimilar } from "@/lib/tasks/similarity";

export function matchOpenTaskByMessage(
  message: string,
  candidates: Task[],
): Task | null {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 80 || candidates.length === 0) {
    return null;
  }

  const exact: Task[] = [];
  const similar: Task[] = [];

  for (const task of candidates) {
    if (normalizeGroupKey(task.description) === normalizeGroupKey(trimmed)) {
      exact.push(task);
      continue;
    }

    if (areTaskDescriptionsSimilar(trimmed, task.description)) {
      similar.push(task);
    }
  }

  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) return null;
  if (similar.length === 1) return similar[0]!;

  return null;
}
