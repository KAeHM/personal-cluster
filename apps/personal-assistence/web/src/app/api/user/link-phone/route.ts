import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import { linkPhoneToUser } from "@/lib/users/link-phone";

const bodySchema = z.object({
  phone: z.string().min(10),
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
    const result = await linkPhoneToUser(dbUser.id, body.phone);

    return NextResponse.json({
      ok: true,
      phone: result.phone,
      merged: result.merged,
      message: result.merged
        ? "Telefone vinculado e histórico do WhatsApp mesclado à sua conta."
        : "Telefone vinculado com sucesso.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Erro ao vincular telefone";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
