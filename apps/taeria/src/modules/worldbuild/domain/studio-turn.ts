import type { ContentFacetType } from "./facet-type";
import type { CodexDraft } from "./codex-draft";

export type StudioLastEvent =
  | { type: "user_edited_facet"; facetType: ContentFacetType }
  | { type: "user_edited_edges" }
  | { type: "user_edited_identity" }
  | { type: "regenerate_facet"; facetType: ContentFacetType }
  | { type: "decision"; key: string; value: string };

export interface StudioTurn {
  message?: string;
  draft: CodexDraft;
  focus?: ContentFacetType;
  lastEvent?: StudioLastEvent;
}
