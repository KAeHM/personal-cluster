export const FACET_TYPES = [
  "lore",
  "system",
  "lexicon",
  "visual",
  "edges",
  "embeddings",
] as const;

export type FacetType = (typeof FACET_TYPES)[number];

export const CONTENT_FACET_TYPES = ["lore", "system", "lexicon"] as const;

export type ContentFacetType = (typeof CONTENT_FACET_TYPES)[number];

export const STORED_FACET_TYPES = [
  "lore",
  "system",
  "lexicon",
  "visual",
] as const;

export type StoredFacetType = (typeof STORED_FACET_TYPES)[number];

export const FACET_DISPLAY_ORDER: Record<FacetType, number> = {
  lore: 0,
  system: 1,
  lexicon: 2,
  visual: 3,
  edges: 4,
  embeddings: 5,
};

export const FACET_LABELS: Record<FacetType, string> = {
  lore: "Lore",
  system: "Sistema",
  lexicon: "Léxico",
  visual: "Visual",
  edges: "Relações",
  embeddings: "Embeddings",
};
