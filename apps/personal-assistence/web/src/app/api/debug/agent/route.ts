import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { runAgent } from "@/lib/ai/agent";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOrCreateUserByPhone } from "@/lib/tasks/queries";

const requestSchema = z.object({
  message: z.string().min(1),
  phone: z.string().optional(),
  userId: z.string().optional(),
});

function isDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_AGENT_DEBUG === "true"
  );
}

export async function POST(request: Request) {
  if (!isDebugEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = requestSchema.parse(await request.json());
    const session = await auth();

    let userId = body.userId;

    if (body.phone) {
      const user = await getOrCreateUserByPhone(body.phone);
      userId = user.id;
    }

    if (!userId && session?.user?.id) {
      userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Informe phone, userId ou autentique-se para usar a rota de debug.",
        },
        { status: 400 },
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const result = await runAgent({ userId, message: body.message });

    return NextResponse.json({
      userId,
      message: body.message,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Payload inválido", details: error.flatten() },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Erro interno do agente";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
