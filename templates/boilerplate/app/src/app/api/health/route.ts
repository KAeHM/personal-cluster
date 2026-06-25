// Liveness probe (não toca no banco). Útil para healthcheck de container/orquestrador.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}
