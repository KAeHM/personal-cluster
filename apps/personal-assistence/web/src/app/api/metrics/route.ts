import {
  getMetricsRegistry,
  withRouteMetrics,
} from "@/common/adapters/observability/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROUTE = "/api/metrics";

export async function GET(): Promise<Response> {
  return withRouteMetrics("GET", ROUTE, async () => {
    const registry = getMetricsRegistry();
    const body = await registry.metrics();
    return new Response(body, {
      headers: { "content-type": registry.contentType },
    });
  });
}
