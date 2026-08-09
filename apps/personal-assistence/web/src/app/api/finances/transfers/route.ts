import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import { transferBetweenBoxes } from "@/modules/finances/application/queries";
import { transferSchema } from "@/modules/finances/application/schemas/movement.schema";
import { serializeBox } from "@/lib/finances/types";

const ROUTE = "/api/finances/transfers";

export async function POST(request: Request) {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const parsed = transferSchema.safeParse(
        await request.json().catch(() => null),
      );

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const result = await transferBetweenBoxes(user.id, parsed.data);

      return Response.json(
        {
          transfer: {
            id: result.transfer.id,
            fromBoxId: result.transfer.fromBoxId,
            toBoxId: result.transfer.toBoxId,
            amountCents: result.transfer.amountCents,
            description: result.transfer.description,
            occurredAt: result.transfer.occurredAt.toISOString(),
          },
          fromBox: result.fromBox ? serializeBox(result.fromBox) : null,
          toBox: result.toBox ? serializeBox(result.toBox) : null,
        },
        { status: 201 },
      );
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
