import { revalidatePath } from "next/cache";
import { z } from "zod";

import { errorResponse } from "@/common/adapters/http/error-response";
import { requireSessionUser } from "@/common/adapters/http/require-session-user";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { COMMON_ERRORS } from "@/common/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ROUTE = "/api/user/onboarding";

const bodySchema = z.object({
  action: z.literal("complete"),
});

export async function POST(request: Request) {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const dbUser = await requireSessionUser();
      const body = await request.json().catch(() => null);
      const parsed = bodySchema.safeParse(body);

      if (!parsed.success) {
        throw COMMON_ERRORS.create("VALIDATION", {
          messageOverride: "Requisição inválida",
        });
      }

      const [updated] = await db
        .update(users)
        .set({ onboardingCompletedAt: new Date() })
        .where(eq(users.id, dbUser.id))
        .returning({
          id: users.id,
          onboardingCompletedAt: users.onboardingCompletedAt,
        });

      if (!updated) {
        throw COMMON_ERRORS.create("NOT_FOUND", {
          messageOverride: "Usuário não encontrado.",
        });
      }

      revalidatePath("/dashboard", "layout");
      revalidatePath("/dashboard");

      return Response.json({
        ok: true,
        onboardingCompletedAt: updated.onboardingCompletedAt,
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
