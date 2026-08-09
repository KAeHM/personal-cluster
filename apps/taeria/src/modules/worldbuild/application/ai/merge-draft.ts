import type { CodexDraft } from "../../domain/codex-draft";
import type { ContentFacetType } from "../../domain/facet-type";
import type { FacetAgentOutput } from "./types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeFacet(
  current: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base = current ?? {};
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMergeFacet(
        result[key] as Record<string, unknown>,
        value,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function shouldSkipFacetGeneration(
  draft: CodexDraft,
  facetType: ContentFacetType,
  explicitRegenerate: boolean,
): boolean {
  if (explicitRegenerate) {
    return false;
  }
  return Boolean(draft.meta.userEdited[facetType]);
}

export function mergeFacetPatches(
  draft: CodexDraft,
  patches: FacetAgentOutput[],
  options?: { forceFacetTypes?: ContentFacetType[] },
): CodexDraft {
  const force = new Set(options?.forceFacetTypes ?? []);
  const facets = { ...draft.facets };

  for (const patch of patches) {
    if (
      shouldSkipFacetGeneration(
        draft,
        patch.facetType,
        force.has(patch.facetType),
      )
    ) {
      continue;
    }

    facets[patch.facetType] = deepMergeFacet(
      facets[patch.facetType],
      patch.data,
    );
  }

  return {
    ...draft,
    facets,
  };
}

export function mergeDraftIdentity(
  draft: CodexDraft,
  identity: {
    kindSlug?: string | null;
    title?: string | null;
    slug?: string | null;
  },
): CodexDraft {
  return {
    ...draft,
    kindSlug: identity.kindSlug ?? draft.kindSlug,
    title: identity.title ?? draft.title,
    slug: identity.slug ?? draft.slug,
  };
}

export function mergeDraftEdges(
  draft: CodexDraft,
  edges: CodexDraft["edges"],
  replace = false,
): CodexDraft {
  if (replace) {
    return { ...draft, edges };
  }

  const existing = new Map(
    draft.edges.map((edge) => [`${edge.type}:${edge.toSlug}`, edge]),
  );

  for (const edge of edges) {
    existing.set(`${edge.type}:${edge.toSlug}`, edge);
  }

  return {
    ...draft,
    edges: Array.from(existing.values()),
  };
}
