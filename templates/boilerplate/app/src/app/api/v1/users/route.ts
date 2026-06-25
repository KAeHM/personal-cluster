import { isValidApiKey } from "@/common/adapters/http/api-key";
import { errorResponse } from "@/common/adapters/http/error-response";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import { AUTH_ERRORS } from "@/modules/auth";
import { createUser, createUserSchema, listUsers } from "@/modules/users";

const ROUTE = "/api/v1/users";

/**
 * API externa de usuários (consumo por terceiros). Autentica por API key e
 * chama os mesmos use cases que a Server Action interna usa.
 */
export async function GET(request: Request): Promise<Response> {
  return withRouteMetrics("GET", ROUTE, async () => {
    try {
      if (!isValidApiKey(request)) {
        throw AUTH_ERRORS.create("UNAUTHORIZED");
      }

      const users = await listUsers();
      return Response.json({ data: users });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "GET" });
    }
  });
}

export async function POST(request: Request): Promise<Response> {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      if (!isValidApiKey(request)) {
        throw AUTH_ERRORS.create("UNAUTHORIZED");
      }

      const body = await request.json().catch(() => null);
      const parsed = createUserSchema.safeParse(body);
      if (!parsed.success) {
        throw COMMON_ERRORS.create("VALIDATION", {
          meta: { issues: parsed.error.flatten() },
        });
      }

      const user = await createUser(parsed.data);
      return Response.json({ data: user }, { status: 201 });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
