import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { getFinancesOverviewData } from "@/lib/finances/queries";

const ROUTE = "/api/finances";

export async function GET() {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const data = await getFinancesOverviewData(user.id, user.timezone);
      return Response.json(data);
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}
