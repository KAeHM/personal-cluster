import type { CodexDraft } from "./codex-draft";
import type { StudioSession } from "./studio-session";

export interface StudioSessionRepository {
  findById(id: string): Promise<StudioSession | null>;
  upsert(
    userId: string,
    sessionId: string,
    draft: CodexDraft,
  ): Promise<StudioSession>;
}
