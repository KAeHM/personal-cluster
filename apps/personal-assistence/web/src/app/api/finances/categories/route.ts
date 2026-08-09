import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import {
  createCategory,
  listCategories,
} from "@/modules/finances/application/queries";
import { createCategorySchema } from "@/modules/finances/application/schemas/category.schema";
import type { FinanceCategory } from "@/modules/finances/domain/movement.entity";

const ROUTE = "/api/finances/categories";

export async function GET() {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const categories = await listCategories(user.id);

      return Response.json({
        categories: categories.map((category: FinanceCategory) => ({
          id: category.id,
          name: category.name,
          color: category.color,
          createdAt: category.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function POST(request: Request) {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const parsed = createCategorySchema.safeParse(
        await request.json().catch(() => null),
      );

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
        throw COMMON_ERRORS.create("VALIDATION", { messageOverride: message });
      }

      const category = await createCategory(user.id, parsed.data);

      return Response.json(
        {
          category: {
            id: category.id,
            name: category.name,
            color: category.color,
            createdAt: category.createdAt.toISOString(),
          },
        },
        { status: 201 },
      );
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
