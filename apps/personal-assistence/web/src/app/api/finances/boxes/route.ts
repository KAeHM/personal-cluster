import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import { createBox, listBoxes } from "@/modules/finances/application/queries";
import { createBoxSchema } from "@/modules/finances/application/schemas/box.schema";
import { serializeBox } from "@/lib/finances/types";

const ROUTE = "/api/finances/boxes";

export async function GET() {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const boxes = await listBoxes(user.id);
      return Response.json({ boxes: boxes.map(serializeBox) });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function POST(request: Request) {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const parsed = createBoxSchema.safeParse(
        await request.json().catch(() => null),
      );

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const box = await createBox(user.id, parsed.data);
      return Response.json({ box: serializeBox(box) }, { status: 201 });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
