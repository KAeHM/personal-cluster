import { z } from "zod";

import { errorResponse } from "@/common/adapters/http/error-response";
import { withRouteMetrics } from "@/common/adapters/observability/metrics";
import { requireRole } from "@/modules/auth";
import { orchestrateStudioTurn } from "@/modules/worldbuild/application/ai/orchestrator";
import type { CodexDraft } from "@/modules/worldbuild/domain/codex-draft";
import type { StudioTurn } from "@/modules/worldbuild/domain/studio-turn";
import { getStudioSessionRepository } from "@/modules/worldbuild/infrastructure/studio-session.repository.factory";

const ROUTE = "/api/studio/chat";

const studioTurnSchema = z.object({
  message: z.string().optional(),
  draft: z.custom<CodexDraft>(),
  focus: z.enum(["lore", "system", "lexicon"]).optional(),
  lastEvent: z
    .object({
      type: z.string(),
      facetType: z.enum(["lore", "system", "lexicon"]).optional(),
      key: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request): Promise<Response> {
  return withRouteMetrics("POST", ROUTE, async () => {
    try {
      const session = await requireRole("admin");
      const body = await request.json().catch(() => null);
      const parsed = studioTurnSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: "Payload inválido.", issues: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const turn = parsed.data as StudioTurn;
      const result = await orchestrateStudioTurn(turn);

      const sessionRepo = await getStudioSessionRepository();
      await sessionRepo.upsert(
        session.user.id,
        result.draft.sessionId,
        result.draft,
      );

      return Response.json({
        draft: result.draft,
        parts: result.parts,
      });
    } catch (error) {
      return errorResponse(error, { route: ROUTE, method: "POST" });
    }
  });
}
