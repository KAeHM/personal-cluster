import type { CodexDraftEdge } from "@/modules/worldbuild/domain/codex-draft";
import type {
  CodexEdgeWithTarget,
  CodexEntry,
} from "@/modules/worldbuild/domain/codex-entry";
import type {
  ContentFacetType,
  StoredFacetType,
} from "@/modules/worldbuild/domain/facet-type";
import {
  CONTENT_FACET_TYPES,
  STORED_FACET_TYPES,
} from "@/modules/worldbuild/domain/facet-type";
import type { CodexDraft } from "@/modules/worldbuild/domain/codex-draft";

export type CodexFormValues = {
  title: string;
  slug: string;
  visibility: "private" | "public";
  sharedUserIds: string[];
  facets: Partial<Record<StoredFacetType, Record<string, unknown>>>;
  edges: CodexDraftEdge[];
};

export function draftToFormValues(draft: CodexDraft): CodexFormValues {
  return {
    title: draft.title ?? "",
    slug: draft.slug ?? "",
    visibility: "private",
    sharedUserIds: [],
    facets: draft.facets,
    edges: draft.edges,
  };
}

export function entryToFormValues(
  entry: CodexEntry,
  edgesWithTargets: CodexEdgeWithTarget[],
): CodexFormValues {
  const facets: CodexFormValues["facets"] = {};
  for (const facet of entry.facets) {
    facets[facet.facetType] = facet.data;
  }

  return {
    title: entry.title,
    slug: entry.slug,
    visibility: entry.visibility,
    sharedUserIds: entry.sharedUserIds ?? [],
    facets,
    edges: edgesWithTargets.map((edge) => ({
      type: edge.edgeType,
      toSlug: edge.toEntry?.slug ?? "",
      payload: edge.payload ?? undefined,
    })),
  };
}

export function formValuesToEntryPayload(values: CodexFormValues) {
  return {
    title: values.title,
    slug: values.slug,
    visibility: values.visibility,
    sharedUserIds: values.sharedUserIds,
    facets: values.facets,
    edges: values.edges,
  };
}

export function emptyFacetsForKind(
  kindSlug: string | null,
  enabledFacetTypes: StoredFacetType[],
): Partial<Record<StoredFacetType, Record<string, unknown>>> {
  if (!kindSlug) {
    return {};
  }

  return Object.fromEntries(
    enabledFacetTypes.map((facetType) => [facetType, {}]),
  ) as Partial<Record<StoredFacetType, Record<string, unknown>>>;
}

export { CONTENT_FACET_TYPES, STORED_FACET_TYPES };
export type { ContentFacetType, StoredFacetType };
