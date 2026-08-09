import type { CodexDraft } from "../../../domain/codex-draft";
import type { StudioSession } from "../../../domain/studio-session";
import type { StudioSessionRepository } from "../../../domain/studio-session.repository";
import { createSupabaseAdminClient } from "@/common/adapters/supabase/admin";

type SessionRow = {
  id: string;
  user_id: string;
  draft: CodexDraft;
  kind_slug: string | null;
  updated_at: string;
};

function toDomain(row: SessionRow): StudioSession {
  return {
    id: row.id,
    userId: row.user_id,
    draft: row.draft,
    kindSlug: row.kind_slug,
    updatedAt: new Date(row.updated_at),
  };
}

export function createSupabaseStudioSessionRepository(): StudioSessionRepository {
  const admin = createSupabaseAdminClient();

  return {
    async findById(id: string): Promise<StudioSession | null> {
      const { data, error } = await admin
        .from("studio_session")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? toDomain(data as SessionRow) : null;
    },

    async upsert(
      userId: string,
      sessionId: string,
      draft: CodexDraft,
    ): Promise<StudioSession> {
      const { data, error } = await admin
        .from("studio_session")
        .upsert(
          {
            id: sessionId,
            user_id: userId,
            draft,
            kind_slug: draft.kindSlug,
          },
          { onConflict: "id" },
        )
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return toDomain(data as SessionRow);
    },
  };
}
