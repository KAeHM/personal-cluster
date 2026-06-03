import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import { getDashboardData } from "@/lib/dashboard/queries";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseDashboardFilters(searchParams);

  const user = await getDbUserFromSession(session);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const data = await getDashboardData(user.id, user.timezone, filters);

  return NextResponse.json(data);
}
