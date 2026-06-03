import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import {
  applyTaskAction,
  deleteTask,
  TaskActionError,
} from "@/lib/tasks/task-actions";
import { getTaskDetail } from "@/lib/tasks/task-detail";
import type { TaskAction } from "@/lib/tasks/task-detail-types";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

const patchBodySchema = z.object({
  action: z.enum(["pause", "resume", "finish"]),
});

async function getAuthorizedUser() {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
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

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await getAuthorizedUser();
  if ("error" in authResult) return authResult.error;

  const { taskId } = await context.params;
  const detail = await getTaskDetail(authResult.user.id, taskId);

  if (!detail) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await getAuthorizedUser();
  if ("error" in authResult) return authResult.error;

  const { taskId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  try {
    const detail = await applyTaskAction(
      authResult.user.id,
      taskId,
      parsed.data.action as TaskAction,
    );
    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof TaskActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await getAuthorizedUser();
  if ("error" in authResult) return authResult.error;

  const { taskId } = await context.params;

  try {
    await deleteTask(authResult.user.id, taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TaskActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
