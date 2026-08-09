import type { CodexDraftEdge } from "../../domain/codex-draft";
import type { StoredFacetType } from "../../domain/facet-type";
import type { Kind } from "../../domain/kind";
import {
  validateCodexDraft,
  type CodexDraftValidationResult,
} from "./validate-codex-draft";

export interface CodexEntryPayload {
  title: string;
  slug: string;
  visibility?: "private" | "public";
  sharedUserIds?: string[];
  facets: Partial<Record<StoredFacetType, Record<string, unknown>>>;
  edges: CodexDraftEdge[];
}

export function validateCodexEntry(
  payload: CodexEntryPayload,
  kind: Kind,
): CodexDraftValidationResult {
  return validateCodexDraft(
    {
      sessionId: "",
      kindSlug: kind.slug,
      title: payload.title,
      slug: payload.slug,
      facets: payload.facets,
      edges: payload.edges,
      meta: {
        userEdited: {},
        validationErrors: {},
        phase: "ready",
      },
    },
    kind,
  );
}
