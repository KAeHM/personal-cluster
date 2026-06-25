import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { getLogger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ready" });
  } catch (error) {
    getLogger().error({ err: error, route: "/api/ready" }, "Readiness check failed");
    return Response.json({ status: "not-ready" }, { status: 503 });
  }
}
