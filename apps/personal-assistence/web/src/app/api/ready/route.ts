import { sql } from "drizzle-orm";

import { getLogger } from "@/common/adapters/logger";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = "/api/ready";

export async function GET(): Promise<Response> {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      await getDb().execute(sql`select 1`);
      return Response.json({ status: "ready" });
    } catch (error) {
      getLogger().error({ err: error, route: ROUTE }, "Readiness check failed");
      return Response.json({ status: "not-ready" }, { status: 503 });
    }
  });
}
