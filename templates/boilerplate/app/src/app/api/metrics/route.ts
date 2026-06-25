import { getMetricsRegistry } from "@/common/adapters/observability/metrics";

// Endpoint de scraping do Prometheus (formato texto). Roda no Node (as métricas
// default usam APIs de processo). Em produção, exponha apenas internamente
// (Service/NetworkPolicy no cluster) — não publique na internet.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const registry = getMetricsRegistry();
  const body = await registry.metrics();
  return new Response(body, {
    headers: { "content-type": registry.contentType },
  });
}
