import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import { getTaskDetail } from "@/lib/tasks/task-detail";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getDbUserFromSession(session);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const { taskId } = await context.params;
  const detail = await getTaskDetail(user.id, taskId);

  if (!detail) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
