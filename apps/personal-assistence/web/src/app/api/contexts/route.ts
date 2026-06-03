import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import { getContextsData } from "@/lib/contexts/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getDbUserFromSession(session);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const data = await getContextsData(user.id);

  return NextResponse.json(data);
}
