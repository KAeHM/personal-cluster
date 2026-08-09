import type { CodexDraft } from "./codex-draft";

export interface StudioSession {
  id: string;
  userId: string;
  draft: CodexDraft;
  kindSlug: string | null;
  updatedAt: Date;
}
