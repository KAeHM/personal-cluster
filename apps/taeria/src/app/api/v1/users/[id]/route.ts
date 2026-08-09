import { isValidApiKey } from "@/common/adapters/http/api-key";
import { errorResponse } from "@/common/adapters/http/error-response";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import { AUTH_ERRORS } from "@/modules/auth";
import {
  deleteUser,
  getUser,
  updateUser,
  updateUserSchema,
} from "@/modules/users";

const ROUTE = "/api/v1/users/[id]";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      if (!isValidApiKey(request)) {
        throw AUTH_ERRORS.create("UNAUTHORIZED");
      }

      const { id } = await params;
      const user = await getUser(id);
      return Response.json({ data: user });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  return withRouteMetrics("PATCH", ROUTE, async () => {
    try {
      if (!isValidApiKey(request)) {
        throw AUTH_ERRORS.create("UNAUTHORIZED");
      }

      const { id } = await params;
      const body = await request.json().catch(() => null);
      const parsed = updateUserSchema.safeParse(body);
      if (!parsed.success) {
        throw COMMON_ERRORS.create("VALIDATION", {
          meta: { issues: parsed.error.flatten() },
        });
      }

      const user = await updateUser(id, parsed.data);
      return Response.json({ data: user });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "PATCH" });
    }
  });
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  return withRouteMetrics("DELETE", ROUTE, async () => {
    try {
      if (!isValidApiKey(request)) {
        throw AUTH_ERRORS.create("UNAUTHORIZED");
      }

      const { id } = await params;
      await deleteUser(id);
      return new Response(null, { status: 204 });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "DELETE" });
    }
  });
}
