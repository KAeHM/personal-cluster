import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { getTaskDetail } from "@/lib/tasks/task-detail";
import { TASK_ERRORS } from "@/modules/tasks/domain/errors";

const ROUTE = "/api/tasks/[taskId]/timeline";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { taskId } = await context.params;
      const detail = await getTaskDetail(user.id, taskId);

      if (!detail) {
        throw TASK_ERRORS.create("NOT_FOUND");
      }

      return Response.json(detail);
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}
