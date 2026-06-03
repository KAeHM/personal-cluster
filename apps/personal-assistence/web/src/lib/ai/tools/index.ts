import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import type { Task } from "@/lib/db/schema";
import { tasks } from "@/lib/db/schema";
import { formatMinutes } from "@/lib/format/time";
import { formatTimeInTimezone, parseEndTime } from "@/lib/format/timezone";
import {
  listWorkGroupsForUser,
  getWorkGroupForUser,
  resolveGroupForTask,
  savePendingGroupClarification,
  touchWorkGroup,
} from "@/lib/groups/queries";
import { sanitizeTaskStartFromUtterance } from "@/lib/ai/ground-task-start";
import { aiDebug, truncateText } from "@/lib/ai/debug-log";
import { buildTaskDescription } from "@/lib/groups/task-description";
import { resolveFinishTarget } from "@/lib/tasks/finish-resolve";
import {
  closeAllPausedTasks,
  finishTask,
  getActiveTask,
  getPausedTasks,
  getLiveTrackedMinutes,
  pauseActiveTask,
  resumeTask,
  savePendingFinishSelection,
  savePendingTaskDuplicate,
  startTask,
} from "@/lib/tasks/queries";
import {
  getClosedMinutesToday,
  getActivePartialMinutes,
  getTotalMinutesToday,
} from "@/lib/tasks/metrics";

export type TaskToolsContext = {
  userId: string;
  timezone: string;
  sourceUtterance?: string;
  runLimits?: {
    taskStarts: number;
  };
};

export function createTaskTools(context: TaskToolsContext) {
  const { userId, timezone, sourceUtterance, runLimits } = context;

  return {
    iniciar_tarefa: tool({
      description:
        "Inicia UMA nova tarefa em andamento por mensagem do usuário. Pausa automaticamente a ativa atual. Não chame esta tool mais de uma vez na mesma mensagem.",
      inputSchema: z.object({
        descricao: z
          .string()
          .min(1)
          .describe(
            "Atividade exatamente como o usuário disse (ex.: 'limpar a casa da Carol', 'relatório mensal'). Não substitua por outra atividade.",
          ),
        group_id: z
          .string()
          .uuid()
          .optional()
          .describe(
            "ID de contexto SOMENTE se o usuário citou explicitamente esse contexto pelo nome. Nunca escolha da lista por conta própria.",
          ),
        grupo_sugerido: z
          .string()
          .min(1)
          .optional()
          .describe(
            "Nome de cliente/projeto/pessoa SOMENTE se o usuário citou na mensagem. Omita se não foi mencionado.",
          ),
        tempo_estimado_minutos: z.number().int().positive().optional(),
      }),
      execute: async ({
        descricao,
        group_id,
        grupo_sugerido,
        tempo_estimado_minutos,
      }) => {
        try {
          if (runLimits && runLimits.taskStarts >= 1) {
            aiDebug("tool:iniciar_tarefa:blocked", {
              reason: "limite de uma tarefa por mensagem",
            });
            return {
              success: false,
              error: "Só é possível iniciar uma tarefa por mensagem.",
            };
          }

          let resolvedDescricao = descricao.trim();
          let citedGroup = grupo_sugerido?.trim();

          if (sourceUtterance?.trim()) {
            const workGroups = await listWorkGroupsForUser(userId);
            const sanitized = sanitizeTaskStartFromUtterance({
              descricao: resolvedDescricao,
              grupoSugerido: citedGroup,
              utterance: sourceUtterance,
              workGroupLabels: workGroups.map((group) => group.label),
            });

            if (
              sanitized.descricao !== resolvedDescricao ||
              sanitized.grupoSugerido !== citedGroup
            ) {
              console.warn("[iniciar_tarefa] input ajustado pela utterance:", {
                model: { descricao: resolvedDescricao, grupo_sugerido: citedGroup },
                sanitized,
              });
              aiDebug("tool:iniciar_tarefa:sanitized", {
                sourceUtterance: truncateText(sourceUtterance),
                before: { descricao: resolvedDescricao, grupo_sugerido: citedGroup },
                after: sanitized,
              });
            }

            resolvedDescricao = sanitized.descricao;
            citedGroup = sanitized.grupoSugerido;
          }

          const safeGroupId = citedGroup ? group_id : undefined;

          const groupResolution = await resolveGroupForTask({
            userId,
            groupId: safeGroupId,
            grupoSugerido: citedGroup,
          });

          if (groupResolution.status === "needs_clarification") {
            await savePendingGroupClarification({
              userId,
              suggestedLabel: groupResolution.suggestedLabel,
              suggestedNormalized: groupResolution.suggestedNormalized,
              candidateGroupId: groupResolution.candidateGroup.id,
              taskDescription: resolvedDescricao,
              estimatedMinutes: tempo_estimado_minutos,
            });

            return {
              success: false,
              pendingClarification: true,
              clarificationType: "group",
              suggestedLabel: groupResolution.suggestedLabel,
              candidateLabel: groupResolution.candidateGroup.label,
              taskDescription: resolvedDescricao,
            };
          }

          const resolvedGroupId =
            groupResolution.status === "resolved"
              ? groupResolution.groupId
              : undefined;

          let groupLabel: string | null = null;
          if (resolvedGroupId) {
            const group = await getWorkGroupForUser(userId, resolvedGroupId);
            groupLabel = group?.label ?? null;
            await touchWorkGroup(resolvedGroupId);
          }

          const taskDescription = buildTaskDescription(
            resolvedDescricao,
            groupLabel,
          );

          aiDebug("tool:iniciar_tarefa:execute", {
            descricao: resolvedDescricao,
            grupoSugerido: citedGroup ?? null,
            groupId: resolvedGroupId ?? null,
            groupLabel,
            taskDescription,
          });

          const startResult = await startTask({
            userId,
            description: taskDescription,
            estimatedMinutes: tempo_estimado_minutos,
            groupId: resolvedGroupId,
          });

          if (startResult.status === "needs_duplicate_clarification") {
            await savePendingTaskDuplicate({
              userId,
              pausedTaskId: startResult.pausedTask.id,
              newDescription: taskDescription,
              estimatedMinutes: tempo_estimado_minutos,
              groupId: resolvedGroupId,
            });

            return {
              success: false,
              pendingClarification: true,
              clarificationType: "duplicate",
              newDescription: taskDescription,
              pausedDescription: startResult.pausedTask.description,
              pausedTaskId: startResult.pausedTask.id,
            };
          }

          if (runLimits) {
            runLimits.taskStarts += 1;
          }

          return {
            success: true,
            taskId: startResult.task.id,
            description: startResult.task.description,
            startedAt: formatTimeInTimezone(startResult.task.startedAt, timezone),
            pausedDescription: startResult.pausedDescription,
            pausedTaskId: startResult.pausedTaskId,
            groupId: resolvedGroupId ?? null,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Erro ao iniciar tarefa",
          };
        }
      },
    }),

    retomar_tarefa: tool({
      description:
        "Retoma uma tarefa pausada pelo ID, colocando-a em andamento e pausando a ativa atual.",
      inputSchema: z.object({
        task_id: z.string().uuid().describe("ID da tarefa pausada a retomar"),
      }),
      execute: async ({ task_id }) => {
        try {
          const { task, pausedDescription, pausedTaskId } = await resumeTask(
            userId,
            task_id,
          );

          return {
            success: true,
            taskId: task.id,
            description: task.description,
            pausedDescription,
            pausedTaskId,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Erro ao retomar tarefa",
          };
        }
      },
    }),

    pausar_tarefa: tool({
      description: "Pausa a tarefa em andamento sem finalizá-la.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const paused = await pauseActiveTask(userId);

          if (!paused) {
            return {
              success: false,
              error: "Nenhuma tarefa em andamento para pausar",
            };
          }

          return {
            success: true,
            taskId: paused.id,
            description: paused.description,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Erro ao pausar tarefa",
          };
        }
      },
    }),

    finalizar_tarefa: tool({
      description:
        "Finaliza tarefa aberta. Sem parâmetros: finaliza a em andamento se houver só uma ativa; com descricao: finaliza pelo nome. Não use task_id.",
      inputSchema: z.object({
        descricao: z
          .string()
          .min(1)
          .optional()
          .describe("Nome da tarefa a finalizar, como o usuário disse"),
        horario_termino: z
          .string()
          .optional()
          .describe("Horário de término retroativo (ISO 8601 ou HH:mm)"),
      }),
      execute: async ({ descricao, horario_termino }) => {
        try {
          const resolved = await resolveFinishTarget({
            userId,
            descricao,
            preferActiveWhenUnspecified: !descricao?.trim(),
          });

          if (resolved.status === "none") {
            return {
              success: false,
              error: "Nenhuma tarefa aberta para finalizar",
            };
          }

          if (resolved.status === "needs_selection") {
            await savePendingFinishSelection(userId);

            return {
              success: false,
              pendingClarification: true,
              clarificationType: "finish_selection",
              options: resolved.options.map((o) => ({
                description: o.task.description,
                groupLabel: o.groupLabel,
                status: o.task.status,
              })),
            };
          }

          const endedAt = parseEndTime(horario_termino, timezone);
          const task = await finishTask(userId, resolved.taskId, endedAt);

          return {
            success: true,
            taskId: task.id,
            description: task.description,
            durationMinutes: task.durationMinutes,
            durationFormatted: formatMinutes(task.durationMinutes ?? 0),
            endedAt: formatTimeInTimezone(task.endedAt!, timezone),
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Erro ao finalizar tarefa",
          };
        }
      },
    }),

    fechar_todas_pausadas: tool({
      description: "Finaliza todas as tarefas pausadas de uma vez.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const result = await closeAllPausedTasks(userId);

          return {
            success: true,
            closedCount: result.closedCount,
            closedDescriptions: result.closedDescriptions,
            closedTaskIds: result.closedTaskIds,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Erro ao fechar tarefas pausadas",
          };
        }
      },
    }),

    listar_tarefas: tool({
      description:
        "Lista tarefa em andamento, pausadas e total de horas trabalhadas hoje.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const [active, paused] = await Promise.all([
            getActiveTask(userId),
            getPausedTasks(userId),
          ]);

          const [closedToday, totalToday] = await Promise.all([
            getClosedMinutesToday(userId, timezone),
            getTotalMinutesToday(userId, timezone),
          ]);

          const mapTask = (task: Task, groupLabel: string | null) => ({
            id: task.id,
            description: task.description,
            groupLabel,
            status: task.status,
            elapsedMinutes: getLiveTrackedMinutes(task),
            elapsedFormatted: formatMinutes(getLiveTrackedMinutes(task)),
            startedAt: formatTimeInTimezone(task.startedAt, timezone),
          });

          let activePayload = null;
          if (active) {
            const row = await db.query.tasks.findFirst({
              where: eq(tasks.id, active.id),
              with: { group: true },
            });
            activePayload = mapTask(active, row?.group?.label ?? null);
          }

          const pausedWithGroups = await Promise.all(
            paused.map(async (task) => {
              const row = await db.query.tasks.findFirst({
                where: eq(tasks.id, task.id),
                with: { group: true },
              });
              return mapTask(task, row?.group?.label ?? null);
            }),
          );

          return {
            success: true,
            active: activePayload,
            paused: pausedWithGroups,
            pausedCount: paused.length,
            closedMinutesToday: closedToday,
            activePartialMinutesToday: await getActivePartialMinutes(userId),
            totalMinutesToday: totalToday,
            totalFormattedToday: formatMinutes(totalToday),
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Erro ao listar tarefas",
          };
        }
      },
    }),
  };
}
