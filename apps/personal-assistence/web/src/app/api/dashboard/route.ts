import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import { getDashboardData } from "@/lib/dashboard/queries";

const ROUTE = "/api/dashboard";

export async function GET(request: Request) {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { searchParams } = new URL(request.url);
      const filters = parseDashboardFilters(searchParams);
      const data = await getDashboardData(user.id, user.timezone, filters);
      return Response.json(data);
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}
