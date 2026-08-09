import { createSupabaseAdminClient } from "@/common/adapters/supabase/admin";
import { logError } from "@/common/errors";

// Readiness probe: checa dependencias (Supabase). Diferente do liveness
// (`/api/health`), se isto falhar o orquestrador deve PARAR de mandar trafego
// para o pod (em vez de reinicia-lo).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      throw error;
    }

    return Response.json({ status: "ready" });
  } catch (error) {
    logError(error, { route: "/api/ready", method: "GET" });
    return Response.json({ status: "not-ready" }, { status: 503 });
  }
}
