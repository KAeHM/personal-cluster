import type { Kind } from "../../domain/kind";

export interface ResolvedRef {
  slug: string;
  title: string;
  kindSlug: string;
}

export interface GenerationContext {
  kind: Kind;
  userIntent: string;
  userMessage?: string;
  resolvedRefs: ResolvedRef[];
  styleNotes: string[];
  systemRules: string[];
  constraints: string[];
  worldTone?: string;
  /** Pai sugerido para edge taxonomy (slug validado contra o codex). */
  taxonomyParentSlug?: string | null;
  /** Pai sugerido para edge classified_as (espécie → taxon). */
  classifiedAsParentSlug?: string | null;
  /**
   * Cânone aprofundado (dossiês/edges via tools do context agent).
   * Consumido pelos agentes escritores.
   */
  canonNotes?: string[];
}

export type PlannerIntent = "create" | "edit_facet" | "clarify" | "regenerate";

export interface PlannerOutput {
  intent: PlannerIntent;
  kindSlug: string | null;
  title: string | null;
  slug: string | null;
  slots: Record<string, string>;
  agentsToRun: Array<"lore" | "system" | "lexicon">;
  summary: string;
}

export interface FacetAgentOutput {
  facetType: "lore" | "system" | "lexicon";
  data: Record<string, unknown>;
}
