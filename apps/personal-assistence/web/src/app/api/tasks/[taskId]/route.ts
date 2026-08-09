import { z } from "zod";

import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import { applyTaskAction, deleteTask } from "@/lib/tasks/task-actions";
import { getTaskDetail } from "@/lib/tasks/task-detail";
import type { TaskAction } from "@/lib/tasks/task-detail-types";
import { TASK_ERRORS } from "@/modules/tasks/domain/errors";

const ROUTE = "/api/tasks/[taskId]";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

const patchBodySchema = z.object({
  action: z.enum(["pause", "resume", "finish"]),
});

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

export async function PATCH(request: Request, context: RouteContext) {
  return withRouteMetrics("PATCH", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { taskId } = await context.params;

      const body = await request.json().catch(() => null);
      const parsed = patchBodySchema.safeParse(body);
      if (!parsed.success) {
        throw COMMON_ERRORS.create("VALIDATION", {
          messageOverride: "Ação inválida",
        });
      }

      const detail = await applyTaskAction(
        user.id,
        taskId,
        parsed.data.action as TaskAction,
      );

      return Response.json(detail);
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "PATCH" });
    }
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withRouteMetrics("DELETE", ROUTE, async () => {
    try {
      const user = await requireSessionUser();
      const { taskId } = await context.params;

      await deleteTask(user.id, taskId);
      return Response.json({ success: true });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "DELETE" });
    }
  });
}
