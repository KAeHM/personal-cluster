import type { User } from "@/lib/db/schema";
import { formatMinutes } from "@/lib/format/time";

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] ?? fullName;
}

export function getUserDisplayName(
  user: User,
  whatsappPushName?: string | null,
): string {
  const fromDb = user.name?.trim();
  if (fromDb) return capitalizeFirst(firstName(fromDb));

  const fromPush = whatsappPushName?.trim();
  if (fromPush) return capitalizeFirst(firstName(fromPush));

  return "Usuário";
}

export type TaskStatusSummary = {
  hasActive: boolean;
  pausedCount: number;
};

export function formatTaskStatusSummary(summary: TaskStatusSummary): string {
  const parts: string[] = [];

  if (summary.hasActive) {
    parts.push("1 em andamento");
  } else {
    parts.push("nenhuma em andamento");
  }

  if (summary.pausedCount === 0) {
    parts.push("nenhuma pausada");
  } else if (summary.pausedCount === 1) {
    parts.push("1 pausada");
  } else {
    parts.push(`${summary.pausedCount} pausadas`);
  }

  return parts.join(", ");
}

export function buildTaskStartedReply(input: {
  displayName: string;
  taskDescription: string;
  pausedDescription: string | null;
  statusSummary: TaskStatusSummary;
}): string {
  const { displayName, taskDescription, pausedDescription, statusSummary } =
    input;

  const lines = [
    `Tudo certo ${displayName}, *${taskDescription}* está em andamento.`,
  ];

  if (pausedDescription) {
    lines.push(`Pausei: *${pausedDescription}*.`);
  }

  lines.push(`Agora você tem ${formatTaskStatusSummary(statusSummary)}.`);

  return lines.join("\n");
}

export function buildTaskResumedReply(input: {
  displayName: string;
  taskDescription: string;
  pausedDescription: string | null;
  statusSummary: TaskStatusSummary;
}): string {
  const { displayName, taskDescription, pausedDescription, statusSummary } =
    input;

  const lines = [
    `Tudo certo ${displayName}, retomei *${taskDescription}*.`,
  ];

  if (pausedDescription) {
    lines.push(`Pausei: *${pausedDescription}*.`);
  }

  lines.push(`Agora você tem ${formatTaskStatusSummary(statusSummary)}.`);

  return lines.join("\n");
}

export function buildTaskFinishedReply(input: {
  displayName: string;
  taskDescription: string;
  durationFormatted: string;
  statusSummary: TaskStatusSummary;
}): string {
  const { displayName, taskDescription, durationFormatted, statusSummary } =
    input;

  return [
    `Tudo certo ${displayName}, finalizei *${taskDescription}* (${durationFormatted}).`,
    `Agora você tem ${formatTaskStatusSummary(statusSummary)}.`,
  ].join("\n");
}

export function buildNoOpenTasksToFinishReply(displayName: string): string {
  return `${displayName}, você não tem tarefas abertas para finalizar agora.`;
}

export function buildFinishSelectionReply(input: {
  displayName: string;
  options: string[];
}): string {
  const { displayName, options } = input;

  return [
    `${displayName}, qual tarefa você quer finalizar?`,
    "",
    ...options,
    "",
    "Responda com o *nome* da tarefa (como na lista).",
  ].join("\n");
}

export function buildFinishSelectionUnclearReply(input: {
  displayName: string;
  options: string[];
}): string {
  const { displayName, options } = input;

  return [
    `${displayName}, não entendi qual tarefa finalizar.`,
    "",
    "Escolha uma destas (responda com o nome):",
    "",
    ...options,
  ].join("\n");
}

export function buildClosedAllPausedReply(
  displayName: string,
  closedCount: number,
  statusSummary: TaskStatusSummary,
): string {
  const closedPhrase =
    closedCount === 1
      ? "1 tarefa pausada foi finalizada"
      : `${closedCount} tarefas pausadas foram finalizadas`;

  return `Tudo certo ${displayName}, ${closedPhrase}. Agora você tem ${formatTaskStatusSummary(statusSummary)}.`;
}

export type TaskListItem = {
  description: string;
  groupLabel: string | null;
  elapsedFormatted: string;
  startedAt: string;
  status: "active" | "paused";
};

export type TaskListToolOutput = {
  success: true;
  active: TaskListItem | null;
  paused: TaskListItem[];
  totalMinutesToday: number;
};

export function parseTaskListToolOutput(
  output: unknown,
): TaskListToolOutput | null {
  if (!isToolOutputSuccess(output)) return null;

  const data = output as Record<string, unknown>;
  if (typeof data.totalMinutesToday !== "number") return null;

  const isListItem = (task: unknown): task is TaskListItem =>
    typeof task === "object" &&
    task !== null &&
    typeof (task as TaskListItem).description === "string" &&
    ((task as TaskListItem).groupLabel === null ||
      typeof (task as TaskListItem).groupLabel === "string") &&
    typeof (task as TaskListItem).elapsedFormatted === "string" &&
    typeof (task as TaskListItem).startedAt === "string" &&
    ((task as TaskListItem).status === "active" ||
      (task as TaskListItem).status === "paused");

  const active =
    data.active === null
      ? null
      : isListItem(data.active)
        ? data.active
        : null;

  const paused = Array.isArray(data.paused)
    ? data.paused.filter(isListItem)
    : [];

  return {
    success: true,
    active,
    paused,
    totalMinutesToday: data.totalMinutesToday,
  };
}

export function buildTaskListReply(
  displayName: string,
  active: TaskListItem | null,
  paused: TaskListItem[],
  totalMinutesToday: number,
): string {
  const lines: string[] = [`${displayName}, suas tarefas:`];

  lines.push("", "*Em andamento*");
  if (active) {
    const contextSuffix = active.groupLabel ? ` [${active.groupLabel}]` : "";
    lines.push(
      `• ${active.description}${contextSuffix} — ${active.elapsedFormatted} (desde ${active.startedAt})`,
    );
  } else {
    lines.push("Nenhuma.");
  }

  lines.push("", "*Pausadas*");
  if (paused.length === 0) {
    lines.push("Nenhuma.");
  } else {
    for (const task of paused) {
      const contextSuffix = task.groupLabel ? ` [${task.groupLabel}]` : "";
      lines.push(
        `• ${task.description}${contextSuffix} — ${task.elapsedFormatted} acumulados`,
      );
    }
  }

  lines.push("", `Total hoje: ${formatMinutes(totalMinutesToday)}`);

  return lines.join("\n");
}

export function buildGroupClarificationReply(input: {
  displayName: string;
  suggestedLabel: string;
  candidateLabel: string;
  taskDescription: string;
}): string {
  const { displayName, suggestedLabel, candidateLabel, taskDescription } =
    input;

  return [
    `${displayName}, antes de iniciar a tarefa preciso confirmar o contexto.`,
    "",
    `Você mencionou *${suggestedLabel}* para registrar: *${taskDescription}*.`,
    "",
    `Já existe um contexto chamado *${candidateLabel}* nas suas horas anteriores.`,
    "",
    `Esse trabalho faz parte do mesmo contexto *${candidateLabel}*, ou é algo separado?`,
    "",
    "Responda *sim* para usar o contexto existente, ou *não* para criar um novo.",
  ].join("\n");
}

export function buildTaskDuplicateClarificationReply(input: {
  displayName: string;
  newDescription: string;
  pausedDescription: string;
}): string {
  const { displayName, newDescription, pausedDescription } = input;

  return [
    `${displayName}, você pediu para começar *${newDescription}*.`,
    "",
    `Já existe uma tarefa pausada parecida: *${pausedDescription}*.`,
    "",
    "Quer *retomar* essa tarefa pausada ou *criar uma nova*?",
    "",
    "Responda *sim* para retomar a pausada, ou *não* para criar uma nova.",
  ].join("\n");
}

export function buildDuplicateClarificationUnclearReply(input: {
  displayName: string;
  newDescription: string;
  pausedDescription: string;
}): string {
  const { displayName, newDescription, pausedDescription } = input;

  return [
    `${displayName}, não entendi sua resposta.`,
    "",
    `Sobre *${newDescription}*: quer retomar *${pausedDescription}* (pausada) ou criar uma tarefa nova?`,
    "",
    "Responda apenas *sim* (retomar) ou *não* (criar nova).",
  ].join("\n");
}

export function buildClarificationUnclearReply(input: {
  displayName: string;
  suggestedLabel: string;
  candidateLabel: string;
  taskDescription: string;
}): string {
  const { displayName, suggestedLabel, candidateLabel, taskDescription } =
    input;

  return [
    `${displayName}, não entendi sua resposta.`,
    "",
    `A tarefa *${taskDescription}* deve ficar no contexto *${candidateLabel}* (o que você chamou de *${suggestedLabel}*)?`,
    "",
    "Responda apenas *sim* ou *não*.",
  ].join("\n");
}

export function parsePendingClarificationOutput(output: unknown): {
  type: "group" | "duplicate" | "finish_selection";
  data: Record<string, unknown>;
} | null {
  if (
    typeof output !== "object" ||
    output === null ||
    !("pendingClarification" in output) ||
    !(output as { pendingClarification: boolean }).pendingClarification
  ) {
    return null;
  }

  const data = output as Record<string, unknown>;
  let type: "group" | "duplicate" | "finish_selection" = "group";

  if (data.clarificationType === "duplicate") {
    type = "duplicate";
  } else if (data.clarificationType === "finish_selection") {
    type = "finish_selection";
  }

  return { type, data };
}

export function isToolOutputSuccess(output: unknown): boolean {
  return (
    typeof output === "object" &&
    output !== null &&
    "success" in output &&
    (output as { success: boolean }).success === true
  );
}
