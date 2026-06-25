import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import { parseDateTimeInTimezone } from "@/lib/format/timezone";
import { prepareTaskInput } from "@/lib/tasks/prepare-task-input";
import {
  createManualTimeEntry,
  createTaskFromPendingDuplicate,
  resumeTask,
  startTask,
} from "@/lib/tasks/queries";

const manualSchema = z.object({
  type: z.literal("manual"),
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  startedAt: z.string().min(1, "Data de início é obrigatória"),
  durationMinutes: z
    .number()
    .int("Duração deve ser um número inteiro")
    .positive("Duração deve ser maior que zero")
    .max(24 * 60, "Duração máxima de 24 horas"),
  groupId: z.string().optional(),
});

const startSchema = z.object({
  type: z.literal("start"),
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  groupId: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
});

const startConfirmSchema = z.object({
  type: z.literal("start_confirm"),
  action: z.enum(["resume", "create_new"]),
  pausedTaskId: z.string().min(1),
  description: z.string().trim().min(1, "Descrição é obrigatória"),
  groupId: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
});

const bodySchema = z.discriminatedUnion("type", [
  manualSchema,
  startSchema,
  startConfirmSchema,
]);

async function getAuthorizedUser() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await getDbUserFromSession(session);

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      ),
    };
  }

  return { user };
}

export async function POST(request: Request) {
  const authResult = await getAuthorizedUser();
  if ("error" in authResult) return authResult.error;

  const { user } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const payload = parsed.data;

  try {
    if (payload.type === "manual") {
      let startedAt: Date;
      try {
        startedAt = parseDateTimeInTimezone(payload.startedAt, user.timezone);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Data/hora inválida";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const now = new Date();
      const endedAt = new Date(
        startedAt.getTime() + payload.durationMinutes * 60_000,
      );

      if (startedAt.getTime() > now.getTime()) {
        return NextResponse.json(
          { error: "Data de início não pode ser no futuro" },
          { status: 400 },
        );
      }

      if (endedAt.getTime() > now.getTime()) {
        return NextResponse.json(
          { error: "Horário de término não pode ser no futuro" },
          { status: 400 },
        );
      }

      const prepared = await prepareTaskInput(
        user.id,
        payload.description,
        payload.groupId,
      );

      const task = await createManualTimeEntry({
        userId: user.id,
        description: prepared.description,
        startedAt,
        durationMinutes: payload.durationMinutes,
        groupId: prepared.groupId,
      });

      return NextResponse.json({
        status: "created",
        task: {
          id: task.id,
          description: task.description,
          startedAt: task.startedAt.toISOString(),
          endedAt: task.endedAt?.toISOString() ?? null,
          durationMinutes: task.durationMinutes,
        },
      });
    }

    if (payload.type === "start") {
      const prepared = await prepareTaskInput(
        user.id,
        payload.description,
        payload.groupId,
      );

      const startResult = await startTask({
        userId: user.id,
        description: prepared.description,
        estimatedMinutes: payload.estimatedMinutes,
        groupId: prepared.groupId,
      });

      if (startResult.status === "needs_duplicate_clarification") {
        return NextResponse.json({
          status: "needs_duplicate_clarification",
          pausedTask: {
            id: startResult.pausedTask.id,
            description: startResult.pausedTask.description,
          },
          newDescription: startResult.newDescription,
        });
      }

      return NextResponse.json({
        status: "started",
        task: {
          id: startResult.task.id,
          description: startResult.task.description,
          startedAt: startResult.task.startedAt.toISOString(),
        },
        pausedDescription: startResult.pausedDescription,
      });
    }

    const prepared = await prepareTaskInput(
      user.id,
      payload.description,
      payload.groupId,
    );

    if (payload.action === "resume") {
      const { task, pausedDescription } = await resumeTask(
        user.id,
        payload.pausedTaskId,
      );

      return NextResponse.json({
        status: "resumed",
        task: {
          id: task.id,
          description: task.description,
          startedAt: task.startedAt.toISOString(),
        },
        pausedDescription,
      });
    }

    const { task, pausedDescription } = await createTaskFromPendingDuplicate(
      user.id,
      prepared.description,
      payload.estimatedMinutes,
      prepared.groupId,
    );

    return NextResponse.json({
      status: "started",
      task: {
        id: task.id,
        description: task.description,
        startedAt: task.startedAt.toISOString(),
      },
      pausedDescription,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao processar tarefa";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
