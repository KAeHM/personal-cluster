import type { FacetType, StoredFacetType } from "./facet-type";

export type CodexDraftPhase =
  | "idle"
  | "planning"
  | "gathering"
  | "generating"
  | "ready";

export interface CodexDraftEdge {
  type: string;
  toSlug: string;
  payload?: Record<string, unknown>;
}

export interface CodexDraft {
  sessionId: string;
  kindSlug: string | null;
  title: string | null;
  slug: string | null;
  facets: Partial<Record<StoredFacetType, Record<string, unknown>>>;
  edges: CodexDraftEdge[];
  meta: {
    userEdited: Partial<Record<FacetType, boolean>>;
    validationErrors: Partial<Record<FacetType, string[]>>;
    phase: CodexDraftPhase;
  };
}

export function createEmptyCodexDraft(sessionId: string): CodexDraft {
  return {
    sessionId,
    kindSlug: null,
    title: null,
    slug: null,
    facets: {},
    edges: [],
    meta: {
      userEdited: {},
      validationErrors: {},
      phase: "idle",
    },
  };
}
