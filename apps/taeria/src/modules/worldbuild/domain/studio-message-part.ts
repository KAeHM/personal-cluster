import type { ContentFacetType } from "./facet-type";

export type StudioMessagePart =
  | { type: "text"; text: string }
  | { type: "facet_editor"; facetType: ContentFacetType }
  | { type: "edges_editor" }
  | {
      type: "decision";
      key: string;
      label: string;
      options: Array<{ value: string; label: string }>;
    }
  | {
      type: "validation";
      facetType: ContentFacetType;
      errors: string[];
    }
  | {
      type: "action";
      action:
        | "create_entry"
        | "regenerate_system"
        | "regenerate_lore"
        | "regenerate_lexicon";
      label: string;
      disabled?: boolean;
    };
