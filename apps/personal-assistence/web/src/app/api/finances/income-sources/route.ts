import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import {
  createIncomeSource,
  getFinanceSettings,
  listIncomeSources,
  updateFinanceSettings,
  updateIncomeSource,
} from "@/modules/finances/application/queries";
import {
  createIncomeSourceSchema,
  updateFinanceSettingsSchema,
  updateIncomeSourceSchema,
} from "@/modules/finances/application/schemas/allocation.schema";
import type { FinanceIncomeSource } from "@/modules/finances/domain/income.entity";

const ROUTE = "/api/finances/income-sources";

function serializeSource(source: FinanceIncomeSource) {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    expectedAmountCents: source.expectedAmountCents,
    isActive: source.isActive,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export async function GET() {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const sources = await listIncomeSources(user.id);
      return Response.json({ sources: sources.map(serializeSource) });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function POST(request: Request) {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const parsed = createIncomeSourceSchema.safeParse(
        await request.json().catch(() => null),
      );

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const source = await createIncomeSource(user.id, parsed.data);
      return Response.json(
        { source: serializeSource(source) },
        { status: 201 },
      );
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}

export async function PATCH(request: Request) {
  return withRouteMetrics("PATCH", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const body = (await request.json().catch(() => null)) as {
        id?: string;
      } | null;

      if (!body?.id) {
        throw COMMON_ERRORS.create("VALIDATION", {
          messageOverride: "ID da fonte é obrigatório.",
        });
      }

      const parsed = updateIncomeSourceSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const source = await updateIncomeSource(user.id, body.id, parsed.data);
      return Response.json({ source: serializeSource(source) });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "PATCH" });
    }
  });
}
