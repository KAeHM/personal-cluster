import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import {
  executeAllocation,
  previewAllocation,
} from "@/modules/finances/application/queries";
import {
  executeAllocationSchema,
  previewAllocationSchema,
} from "@/modules/finances/application/schemas/allocation.schema";

const ROUTE = "/api/finances/allocations";

export async function POST(request: Request) {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const body = await request.json().catch(() => null);
      const mode = (body as { mode?: string } | null)?.mode ?? "preview";

      if (mode === "execute") {
        const parsed = executeAllocationSchema.safeParse(body);
        if (!parsed.success) {
          const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
          throw COMMON_ERRORS.create("VALIDATION", {
            messageOverride: message,
          });
        }

        const result = await executeAllocation(user.id, parsed.data);
        return Response.json(result, { status: 201 });
      }

      const parsed = previewAllocationSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const preview = await previewAllocation(user.id, parsed.data);
      return Response.json({ preview });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
