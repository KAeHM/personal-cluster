import { getMetricsRegistry } from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const registry = getMetricsRegistry();
  const body = await registry.metrics();
  return new Response(body, {
    headers: { "content-type": registry.contentType },
  });
}
