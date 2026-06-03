import { generateText, stepCountIs } from "ai";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import type { User } from "@/lib/db/schema";
import { users } from "@/lib/db/schema";
import { type AgentAudioInput, loadAudioBuffer } from "@/lib/ai/audio-input";
import { aiDebug, summarizeAudioInput, truncateText } from "@/lib/ai/debug-log";
import { getAgentModel } from "@/lib/ai/model";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createTaskTools } from "@/lib/ai/tools";
import { listWorkGroupsForUser } from "@/lib/groups/queries";
import {
  getActiveTask,
  getPausedTasks,
  getTasksForAgentContext,
} from "@/lib/tasks/queries";
import { WHATSAPP_ERRORS } from "@/lib/whatsapp/errors";
import {
  buildClosedAllPausedReply,
  buildGroupClarificationReply,
  buildFinishSelectionReply,
  buildTaskDuplicateClarificationReply,
  buildTaskFinishedReply,
  buildTaskListReply,
  buildTaskResumedReply,
  buildTaskStartedReply,
  getUserDisplayName,
  isToolOutputSuccess,
  parsePendingClarificationOutput,
  parseTaskListToolOutput,
  type TaskListItem,
  type TaskStatusSummary,
} from "@/lib/whatsapp/task-replies";

export type RunAgentInput = {
  userId: string;
  message: string;
  sourceUtterance?: string;
  audio?: AgentAudioInput;
  whatsappPushName?: string | null;
};

export type RunAgentResult = {
  reply: string;
  toolCalls: Array<{
    toolName: string;
    input: unknown;
    output: unknown;
  }>;
  steps: number;
};

type StandardizedReply =
  | {
      kind: "started";
      taskDescription: string;
      pausedDescription: string | null;
    }
  | { kind: "resumed"; taskDescription: string; pausedDescription: string | null }
  | {
      kind: "finished";
      taskDescription: string;
      durationFormatted: string;
    }
  | { kind: "closedAllPaused"; closedCount: number }
  | {
      kind: "listed";
      active: TaskListItem | null;
      paused: TaskListItem[];
      totalMinutesToday: number;
    };

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

function getPendingClarificationFromToolCalls(
  toolCalls: RunAgentResult["toolCalls"],
  displayName: string,
): string | null {
  for (const call of toolCalls) {
    const pending = parsePendingClarificationOutput(call.output);
    if (!pending) continue;

    if (pending.type === "duplicate") {
      const d = pending.data;
      if (
        typeof d.newDescription === "string" &&
        typeof d.pausedDescription === "string"
      ) {
        return buildTaskDuplicateClarificationReply({
          displayName,
          newDescription: d.newDescription,
          pausedDescription: d.pausedDescription,
        });
      }
    }

    if (pending.type === "finish_selection") {
      const options = pending.data.options;
      if (Array.isArray(options)) {
        const lines = options
          .filter(
            (item): item is Record<string, unknown> =>
              typeof item === "object" && item !== null,
          )
          .map((item) => {
            const description =
              typeof item.description === "string" ? item.description : "";
            const groupLabel =
              typeof item.groupLabel === "string" ? item.groupLabel : null;
            const status =
              item.status === "active" ? "em andamento" : "pausada";
            const suffix = groupLabel ? ` [${groupLabel}]` : "";
            return `• *${description}*${suffix} (${status})`;
          })
          .filter((line) => line.length > 2);

        if (lines.length > 0) {
          return buildFinishSelectionReply({ displayName, options: lines });
        }
      }
    }

    if (
      typeof pending.data.suggestedLabel === "string" &&
      typeof pending.data.candidateLabel === "string" &&
      typeof pending.data.taskDescription === "string"
    ) {
      return buildGroupClarificationReply({
        displayName,
        suggestedLabel: pending.data.suggestedLabel,
        candidateLabel: pending.data.candidateLabel,
        taskDescription: pending.data.taskDescription,
      });
    }
  }

  return null;
}

function getLastStandardizedReply(
  toolCalls: RunAgentResult["toolCalls"],
): StandardizedReply | null {
  let result: StandardizedReply | null = null;

  for (const call of toolCalls) {
    if (
      call.toolName === "iniciar_tarefa" &&
      isToolOutputSuccess(call.output) &&
      !parsePendingClarificationOutput(call.output)
    ) {
      const data = call.output as Record<string, unknown>;
      if (typeof data.description === "string") {
        result = {
          kind: "started",
          taskDescription: data.description,
          pausedDescription:
            typeof data.pausedDescription === "string"
              ? data.pausedDescription
              : null,
        };
      }
    }

    if (call.toolName === "retomar_tarefa" && isToolOutputSuccess(call.output)) {
      const data = call.output as Record<string, unknown>;
      if (typeof data.description === "string") {
        result = {
          kind: "resumed",
          taskDescription: data.description,
          pausedDescription:
            typeof data.pausedDescription === "string"
              ? data.pausedDescription
              : null,
        };
      }
    }

    if (
      call.toolName === "finalizar_tarefa" &&
      isToolOutputSuccess(call.output)
    ) {
      const data = call.output as Record<string, unknown>;
      if (typeof data.description === "string") {
        result = {
          kind: "finished",
          taskDescription: data.description,
          durationFormatted:
            typeof data.durationFormatted === "string"
              ? data.durationFormatted
              : "",
        };
      }
    }

    if (
      call.toolName === "fechar_todas_pausadas" &&
      isToolOutputSuccess(call.output)
    ) {
      const data = call.output as Record<string, unknown>;
      result = {
        kind: "closedAllPaused",
        closedCount:
          typeof data.closedCount === "number" ? data.closedCount : 0,
      };
    }

    if (call.toolName === "listar_tarefas") {
      const listOutput = parseTaskListToolOutput(call.output);
      if (listOutput) {
        result = {
          kind: "listed",
          active: listOutput.active,
          paused: listOutput.paused,
          totalMinutesToday: listOutput.totalMinutesToday,
        };
      }
    }
  }

  return result;
}

async function resolveAgentReply(
  user: User,
  userId: string,
  text: string,
  toolCalls: RunAgentResult["toolCalls"],
  whatsappPushName?: string | null,
): Promise<string> {
  const displayName = getUserDisplayName(user, whatsappPushName);

  const pendingReply = getPendingClarificationFromToolCalls(
    toolCalls,
    displayName,
  );
  if (pendingReply) {
    return pendingReply;
  }

  const standardizedReply = getLastStandardizedReply(toolCalls);

  if (standardizedReply) {
    const statusSummary = await getStatusSummary(userId);

    if (standardizedReply.kind === "listed") {
      return buildTaskListReply(
        displayName,
        standardizedReply.active,
        standardizedReply.paused,
        standardizedReply.totalMinutesToday,
      );
    }

    if (standardizedReply.kind === "closedAllPaused") {
      return buildClosedAllPausedReply(
        displayName,
        standardizedReply.closedCount,
        statusSummary,
      );
    }

    if (standardizedReply.kind === "finished") {
      return buildTaskFinishedReply({
        displayName,
        taskDescription: standardizedReply.taskDescription,
        durationFormatted: standardizedReply.durationFormatted,
        statusSummary,
      });
    }

    if (standardizedReply.kind === "resumed") {
      return buildTaskResumedReply({
        displayName,
        taskDescription: standardizedReply.taskDescription,
        pausedDescription: standardizedReply.pausedDescription,
        statusSummary,
      });
    }

    if (standardizedReply.kind === "started") {
      return buildTaskStartedReply({
        displayName,
        taskDescription: standardizedReply.taskDescription,
        pausedDescription: standardizedReply.pausedDescription,
        statusSummary,
      });
    }
  }

  return WHATSAPP_ERRORS.generic;
}

const AUDIO_AGENT_PROMPT = `Ouça o áudio e execute a intenção com as tools.

Regras para iniciar_tarefa:
- Extraia descricao fielmente do que foi dito — não invente nem substitua palavras.
- Não use contextos da lista (group_id) a menos que o usuário tenha falado aquele nome.
- Não invente clientes, projetos ou atividades genéricas (ex.: "call") se não foram ditos.
- Ex.: "limpar a casa da Carol" → descricao "limpar a casa da Carol" (ou descricao "limpar casa", grupo_sugerido "Carol" se fizer sentido).
- Ex. errado: usuário fala "limpar casa da Carol" e você chama iniciar_tarefa com descricao "call" e grupo de outro cliente.

Use tool quando a intenção for clara. Não responda em texto livre.`;

async function runAgentGeneration(input: {
  system: string;
  message: string;
  audio?: AgentAudioInput;
  tools: ReturnType<typeof createTaskTools>;
}) {
  if (input.audio) {
    const { buffer, mimetype } = await loadAudioBuffer(input.audio);

    aiDebug("agent:generate:multimodal", {
      mode: "audio+tools",
      mimetype,
      byteLength: buffer.byteLength,
      audio: summarizeAudioInput(input.audio),
      userPrompt: AUDIO_AGENT_PROMPT,
      systemPromptPreview: truncateText(input.system, 800),
    });

    return generateText({
      model: getAgentModel(),
      system: input.system,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: buffer,
              mediaType: mimetype,
            },
            {
              type: "text",
              text: AUDIO_AGENT_PROMPT,
            },
          ],
        },
      ],
      tools: input.tools,
      stopWhen: stepCountIs(2),
    });
  }

  aiDebug("agent:generate:text", {
    mode: "text+tools",
    userMessage: truncateText(input.message),
    messageLength: input.message.length,
    emptyMessage: input.message.trim().length === 0,
    systemPromptPreview: truncateText(input.system, 800),
    note: "Fluxo WhatsApp atual: áudio vira transcrição antes de chegar aqui",
  });

  return generateText({
    model: getAgentModel(),
    system: input.system,
    prompt: input.message,
    tools: input.tools,
    stopWhen: stepCountIs(2),
  });
}

export async function runAgent({
  userId,
  message,
  sourceUtterance,
  audio,
  whatsappPushName,
}: RunAgentInput): Promise<RunAgentResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const [{ active, paused }, workGroups] = await Promise.all([
    getTasksForAgentContext(userId),
    listWorkGroupsForUser(userId),
  ]);

  const systemPrompt = buildSystemPrompt(user, active, paused, workGroups);

  aiDebug("agent:run:start", {
    userId,
    hasAudio: Boolean(audio),
    message: truncateText(message),
    sourceUtterance: truncateText(sourceUtterance ?? message),
    audio: summarizeAudioInput(audio),
    activeTask: active?.description ?? null,
    pausedCount: paused.length,
    workGroups: workGroups.map((group) => group.label),
  });

  const runLimits = { taskStarts: 0 };

  const tools = createTaskTools({
    userId,
    timezone: user.timezone,
    sourceUtterance: sourceUtterance ?? message,
    runLimits,
  });

  const result = await runAgentGeneration({
    system: systemPrompt,
    message,
    audio,
    tools,
  });

  const toolCalls = result.steps.flatMap((step) =>
    step.toolCalls.map((call, index) => ({
      toolName: call.toolName,
      input: call.input,
      output: step.toolResults[index]?.output,
    })),
  );

  aiDebug("agent:run:result", {
    userId,
    rawText: truncateText(result.text),
    steps: result.steps.length,
    toolCalls: toolCalls.map((call) => ({
      toolName: call.toolName,
      input: call.input,
      output: call.output,
    })),
  });

  const reply = await resolveAgentReply(
    user,
    userId,
    result.text,
    toolCalls,
    whatsappPushName,
  );

  aiDebug("agent:run:reply", {
    userId,
    reply: truncateText(reply),
  });

  return {
    reply,
    toolCalls,
    steps: result.steps.length,
  };
}
