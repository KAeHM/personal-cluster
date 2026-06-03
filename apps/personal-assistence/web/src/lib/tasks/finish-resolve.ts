import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import type { Task } from "@/lib/db/schema";
import { tasks } from "@/lib/db/schema";
import { matchOpenTaskByMessage } from "@/lib/tasks/match-open-task";
import { getTasksForAgentContext } from "@/lib/tasks/queries";

export type OpenTaskOption = {
  task: Task;
  groupLabel: string | null;
};

export async function listOpenTaskOptions(
  userId: string,
): Promise<OpenTaskOption[]> {
  const { active, paused } = await getTasksForAgentContext(userId);
  const ordered = active ? [active, ...paused] : paused;

  return Promise.all(
    ordered.map(async (task) => {
      const row = await db.query.tasks.findFirst({
        where: eq(tasks.id, task.id),
        with: { group: true },
      });

      return {
        task,
        groupLabel: row?.group?.label ?? null,
      };
    }),
  );
}

export type ResolveFinishTargetInput = {
  userId: string;
  taskId?: string;
  descricao?: string;
  /** Generic "finalizar tarefa" with one active — finish that task */
  preferActiveWhenUnspecified?: boolean;
};

export type ResolveFinishTargetResult =
  | { status: "resolved"; taskId: string }
  | { status: "needs_selection"; options: OpenTaskOption[] }
  | { status: "none" };

export async function resolveFinishTarget(
  input: ResolveFinishTargetInput,
): Promise<ResolveFinishTargetResult> {
  const options = await listOpenTaskOptions(input.userId);

  if (options.length === 0) {
    return { status: "none" };
  }

  if (input.taskId) {
    const found = options.find((o) => o.task.id === input.taskId);
    if (found) {
      return { status: "resolved", taskId: found.task.id };
    }
  }

  const candidates = options.map((o) => o.task);

  if (input.descricao?.trim()) {
    const match = matchOpenTaskByMessage(input.descricao, candidates);
    if (match) {
      return { status: "resolved", taskId: match.id };
    }
  }

  if (input.preferActiveWhenUnspecified) {
    const active = options.find((o) => o.task.status === "active");
    if (active) {
      return { status: "resolved", taskId: active.task.id };
    }
  }

  if (options.length === 1) {
    return { status: "resolved", taskId: options[0]!.task.id };
  }

  return { status: "needs_selection", options };
}
