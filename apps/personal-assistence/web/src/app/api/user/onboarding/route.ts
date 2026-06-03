import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  action: z.literal("complete"),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getDbUserFromSession(session);

  if (!dbUser) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  try {
    const body = bodySchema.parse(await request.json());

    if (body.action === "complete") {
      const [updated] = await db
        .update(users)
        .set({ onboardingCompletedAt: new Date() })
        .where(eq(users.id, dbUser.id))
        .returning({ id: users.id, onboardingCompletedAt: users.onboardingCompletedAt });

      if (!updated) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 },
        );
      }

      revalidatePath("/dashboard", "layout");
      revalidatePath("/dashboard");

      return NextResponse.json({
        ok: true,
        onboardingCompletedAt: updated.onboardingCompletedAt,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erro ao atualizar onboarding" },
      { status: 500 },
    );
  }
}
