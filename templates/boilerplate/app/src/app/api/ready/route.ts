import { sql } from "drizzle-orm";
import { getDb } from "@/common/adapters/db/drizzle/client";
import { logError } from "@/common/errors";

// Readiness probe: checa dependencias (banco). Diferente do liveness
// (`/api/health`), se isto falhar o orquestrador deve PARAR de mandar trafego
// para o pod (em vez de reinicia-lo). Roda no Node (acesso ao Postgres).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ready" });
  } catch (error) {
    logError(error, { route: "/api/ready", method: "GET" });
    return Response.json({ status: "not-ready" }, { status: 503 });
  }
}
