import type { StoredFacetType } from "../../domain/facet-type";
import type { CodexDraft } from "../../domain/codex-draft";
import type { Kind } from "../../domain/kind";
import { STORED_FACET_TYPES } from "../../domain/facet-type";
import { validateFacetData } from "./compile-facet-zod";
import { slugifyName } from "./facet-schema";

export interface CodexDraftValidationResult {
  valid: boolean;
  errors: Partial<Record<StoredFacetType, string[]>>;
  identityErrors: string[];
}

function isStoredFacetEnabled(kind: Kind, facetType: StoredFacetType): boolean {
  return kind.facets.some(
    (facet) => facet.facetType === facetType && facet.enabled,
  );
}

/**
 * Valida um rascunho de codex contra o kind selecionado.
 */
export function validateCodexDraft(
  draft: CodexDraft,
  kind: Kind,
): CodexDraftValidationResult {
  const errors: Partial<Record<StoredFacetType, string[]>> = {};
  const identityErrors: string[] = [];

  if (!draft.title?.trim()) {
    identityErrors.push("Título obrigatório.");
  }

  if (!draft.slug?.trim()) {
    identityErrors.push("Identificador (slug) obrigatório.");
  } else if (draft.slug !== slugifyName(draft.slug)) {
    identityErrors.push("Slug deve estar em kebab-case.");
  }

  for (const facetType of STORED_FACET_TYPES) {
    const facetConfig = kind.facets.find(
      (facet) => facet.facetType === facetType,
    );
    if (!facetConfig?.enabled) {
      continue;
    }

    const data = draft.facets[facetType];
    if (!data || Object.keys(data).length === 0) {
      if (facetConfig.required) {
        errors[facetType] = ["Faceta obrigatória não preenchida."];
      }
      continue;
    }

    const result = validateFacetData(kind, facetType, data);
    if (!result.success) {
      errors[facetType] = result.errors;
    }
  }

  const edgesFacet = kind.facets.find((facet) => facet.facetType === "edges");
  if (edgesFacet?.enabled) {
    for (const [index, edge] of draft.edges.entries()) {
      if (!edge.type.trim()) {
        identityErrors.push(`Relação ${index + 1}: tipo obrigatório.`);
      }
      if (!edge.toSlug.trim()) {
        identityErrors.push(`Relação ${index + 1}: destino obrigatório.`);
      }
    }
  }

  const valid = identityErrors.length === 0 && Object.keys(errors).length === 0;

  return { valid, errors, identityErrors };
}

export function isDraftReadyForCreate(draft: CodexDraft, kind: Kind): boolean {
  if (!draft.kindSlug || draft.kindSlug !== kind.slug) {
    return false;
  }

  return validateCodexDraft(draft, kind).valid;
}

export function listEnabledRequiredFacets(kind: Kind): StoredFacetType[] {
  return STORED_FACET_TYPES.filter(
    (facetType) =>
      isStoredFacetEnabled(kind, facetType) &&
      kind.facets.some(
        (facet) => facet.facetType === facetType && facet.required,
      ),
  );
}
