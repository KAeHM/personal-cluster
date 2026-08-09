import type { CodexEntry, CodexEntrySummary } from "./codex-entry";

export type WikiKindSummary = {
  slug: string;
  name: string;
  description: string | null;
  entryCount: number;
};

export interface WikiListEntriesParams {
  limit?: number;
  offset?: number;
  kindSlug?: string;
  query?: string;
}

export interface WikiListEntriesResult {
  entries: CodexEntrySummary[];
  total: number;
}

/** Alvo de edge taxonômica — `to_entry` (pai). */
export type WikiTaxonomyEdgeTarget = {
  id: string;
  slug: string;
  title: string;
  kindSlug: string;
};

/** Edge `taxonomy`: `from_entry` = filho, `to_entry` = pai. */
export type WikiTaxonomyEdge = {
  id: string;
  childEntryId: string;
  childSlug: string;
  childTitle: string;
  childKindSlug: string;
  parent: WikiTaxonomyEdgeTarget;
  payload: Record<string, unknown> | null;
};

export interface WikiCodexRepository {
  findBySlug(slug: string): Promise<CodexEntry | null>;
  findByIds(ids: string[]): Promise<CodexEntry[]>;
  list(params: WikiListEntriesParams): Promise<WikiListEntriesResult>;
  listVisibleKindSlugs(): Promise<string[]>;
  findKindBySlug(slug: string): Promise<WikiKindSummary | null>;
  listVisibleKinds(): Promise<WikiKindSummary[]>;
  listTaxonomyEdgesForKind(kindSlug: string): Promise<WikiTaxonomyEdge[]>;
  /** Edges `classified_as`: espécie (kindSlug) → taxon pai. */
  listClassifiedAsEdgesForKind(kindSlug: string): Promise<WikiTaxonomyEdge[]>;
  listTaxonomyChildren(entryId: string): Promise<WikiTaxonomyEdgeTarget[]>;
}
