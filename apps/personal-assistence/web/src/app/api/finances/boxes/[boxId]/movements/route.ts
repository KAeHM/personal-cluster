import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import { recordMovement } from "@/modules/finances/application/queries";
import {
  listMovementsQuerySchema,
  recordMovementSchema,
} from "@/modules/finances/application/schemas/movement.schema";
import { getMovementRepository } from "@/modules/finances/infrastructure/movement.repository.factory";
import { serializeBox, serializeMovement } from "@/lib/finances/types";

const ROUTE = "/api/finances/boxes/[boxId]/movements";

type RouteContext = { params: Promise<{ boxId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { boxId } = await context.params;
      const url = new URL(request.url);
      const parsed = listMovementsQuerySchema.safeParse({
        from: url.searchParams.get("from") ?? undefined,
        to: url.searchParams.get("to") ?? undefined,
        limit: url.searchParams.get("limit") ?? undefined,
      });

      if (!parsed.success) {
        const message =
          parsed.error.issues[0]?.message ?? "Parâmetros inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const movementRepo = getMovementRepository();
      const movements = await movementRepo.listByBox(user.id, boxId, {
        from: parsed.data.from ? new Date(parsed.data.from) : undefined,
        to: parsed.data.to ? new Date(parsed.data.to) : undefined,
        limit: parsed.data.limit,
      });

      return Response.json({
        movements: movements.map(serializeMovement),
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { boxId } = await context.params;
      const parsed = recordMovementSchema.safeParse(
        await request.json().catch(() => null),
      );

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const result = await recordMovement(user.id, boxId, parsed.data);

      return Response.json(
        {
          movement: serializeMovement({
            ...result.movement,
            boxName: result.box?.name ?? "",
            categoryName: null,
            transferFromBoxName: null,
            transferToBoxName: null,
          }),
          box: result.box ? serializeBox(result.box) : null,
        },
        { status: 201 },
      );
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
