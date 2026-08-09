import type { StoredFacetType } from "./facet-type";

export type CodexEntryVisibility = "private" | "public";

export interface CodexFacetData {
  id: string;
  entryId: string;
  facetType: StoredFacetType;
  data: Record<string, unknown>;
}

export interface CodexEdge {
  id: string;
  fromEntryId: string;
  toEntryId: string;
  edgeType: string;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CodexEmbedding {
  id: string;
  entryId: string;
  chunkIndex: number;
  content: string;
}

export interface CodexEmbeddingChunk {
  chunkIndex: number;
  content: string;
  embedding: number[];
}

export interface CodexSimilarChunk {
  entryId: string;
  slug: string;
  title: string;
  kindSlug: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

export interface CodexEntry {
  id: string;
  kindId: string;
  slug: string;
  title: string;
  visibility: CodexEntryVisibility;
  createdAt: Date;
  updatedAt: Date;
  facets: CodexFacetData[];
  edges: CodexEdge[];
  sharedUserIds?: string[];
}

export interface CodexEntrySummary {
  id: string;
  kindId: string;
  kindSlug: string;
  slug: string;
  title: string;
  visibility: CodexEntryVisibility;
  shareCount: number;
  updatedAt: Date;
}

export interface CodexEdgeTarget {
  id: string;
  slug: string;
  title: string;
}

export interface CodexEdgeWithTarget extends CodexEdge {
  toEntry: CodexEdgeTarget | null;
}

export interface NewCodexEntry {
  kindId: string;
  slug: string;
  title: string;
  visibility?: CodexEntryVisibility;
  sharedUserIds?: string[];
  facets: Array<{
    facetType: StoredFacetType;
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    toEntryId: string;
    edgeType: string;
    payload?: Record<string, unknown> | null;
  }>;
}

export interface UpdateCodexEntry {
  title: string;
  slug: string;
  visibility?: CodexEntryVisibility;
  sharedUserIds?: string[];
  facets: Array<{
    facetType: StoredFacetType;
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    toEntryId: string;
    edgeType: string;
    payload?: Record<string, unknown> | null;
  }>;
}

export interface ListCodexEntriesParams {
  limit?: number;
  offset?: number;
  kindSlug?: string;
  visibility?: CodexEntryVisibility;
  query?: string;
}

export interface ListCodexEntriesResult {
  entries: CodexEntrySummary[];
  total: number;
}

export type EnabledFacetType = StoredFacetType | "edges" | "embeddings";
