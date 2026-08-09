import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import {
  deleteBox,
  getBoxDetail,
  updateBox,
} from "@/modules/finances/application/queries";
import { updateBoxSchema } from "@/modules/finances/application/schemas/box.schema";
import { serializeBox, serializeMovement } from "@/lib/finances/types";

const ROUTE = "/api/finances/boxes/[boxId]";

type RouteContext = { params: Promise<{ boxId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { boxId } = await context.params;
      const detail = await getBoxDetail(user.id, boxId);

      return Response.json({
        box: serializeBox(detail.box),
        movements: detail.movements.map(serializeMovement),
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withRouteMetrics("PATCH", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { boxId } = await context.params;
      const parsed = updateBoxSchema.safeParse(
        await request.json().catch(() => null),
      );

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const box = await updateBox(user.id, boxId, parsed.data);
      return Response.json({ box: serializeBox(box) });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "PATCH" });
    }
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withRouteMetrics("DELETE", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { boxId } = await context.params;
      await deleteBox(user.id, boxId);
      return Response.json({ success: true });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "DELETE" });
    }
  });
}
