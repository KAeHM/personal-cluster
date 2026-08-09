import { withRouteMetrics } from "@/common/adapters/observability/metrics";

export const dynamic = "force-dynamic";

const ROUTE = "/api/health";

export function GET(): Promise<Response> {
  return withRouteMetrics("GET", ROUTE, async () =>
    Response.json({ status: "ok", timestamp: new Date().toISOString() }),
  );
}
