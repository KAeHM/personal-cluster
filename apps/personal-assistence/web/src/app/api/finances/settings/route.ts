import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import {
  getFinanceSettings,
  updateFinanceSettings,
} from "@/modules/finances/application/queries";
import { updateFinanceSettingsSchema } from "@/modules/finances/application/schemas/allocation.schema";

const ROUTE = "/api/finances/settings";

export async function GET() {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const data = await getFinanceSettings(user.id);

      return Response.json({
        settings: {
          monthlyFixedIncomeCents: data.settings.monthlyFixedIncomeCents,
          updatedAt: data.settings.updatedAt.toISOString(),
        },
        incomeSources: data.incomeSources.map((source) => ({
          id: source.id,
          name: source.name,
          type: source.type,
          expectedAmountCents: source.expectedAmountCents,
          isActive: source.isActive,
        })),
        computedFixedIncomeCents: data.computedFixedIncomeCents,
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function PATCH(request: Request) {
  return withRouteMetrics("PATCH", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const parsed = updateFinanceSettingsSchema.safeParse(
        await request.json().catch(() => null),
      );

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const settings = await updateFinanceSettings(user.id, parsed.data);

      return Response.json({
        settings: {
          monthlyFixedIncomeCents: settings.monthlyFixedIncomeCents,
          updatedAt: settings.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "PATCH" });
    }
  });
}
