import type { CodexDraft } from "../../domain/codex-draft";
import type { CodexEntry } from "../../domain/codex-entry";
import { CODEX_ERRORS } from "../../domain/errors";
import { STORED_FACET_TYPES } from "../../domain/facet-type";
import { getCodexRepository } from "../../infrastructure/codex.repository.factory";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import { embedCodexEntrySafe } from "../ai/embed-entry";
import { validateCodexDraft } from "../schemas/validate-codex-draft";

export async function createCodexFromDraft(
  draft: CodexDraft,
): Promise<CodexEntry> {
  if (!draft.kindSlug || !draft.slug || !draft.title) {
    throw CODEX_ERRORS.create("VALIDATION_FAILED", {
      meta: { reason: "identity_incomplete" },
    });
  }

  const kindRepo = await getKindRepository();
  const kind = await kindRepo.findBySlug(draft.kindSlug);
  if (!kind) {
    throw CODEX_ERRORS.create("KIND_NOT_FOUND", {
      meta: { kindSlug: draft.kindSlug },
    });
  }

  const validation = validateCodexDraft(draft, kind);
  if (!validation.valid) {
    throw CODEX_ERRORS.create("VALIDATION_FAILED", {
      meta: {
        errors: validation.errors,
        identityErrors: validation.identityErrors,
      },
    });
  }

  const codexRepo = await getCodexRepository();
  if (await codexRepo.slugExists(draft.slug)) {
    throw CODEX_ERRORS.create("SLUG_TAKEN", { meta: { slug: draft.slug } });
  }

  const facets = STORED_FACET_TYPES.filter((facetType) => {
    const config = kind.facets.find((facet) => facet.facetType === facetType);
    return config?.enabled && draft.facets[facetType];
  }).map((facetType) => ({
    facetType,
    data: draft.facets[facetType]!,
  }));

  const edgeTargets = new Map<string, string>();
  for (const edge of draft.edges) {
    const target = await codexRepo.findBySlug(edge.toSlug);
    if (!target) {
      throw CODEX_ERRORS.create("NOT_FOUND", {
        meta: { slug: edge.toSlug, context: "edge_target" },
      });
    }
    edgeTargets.set(edge.toSlug, target.id);
  }

  const entry = await codexRepo.create({
    kindId: kind.id,
    slug: draft.slug,
    title: draft.title,
    visibility: "private",
    facets,
    edges: draft.edges.map((edge) => ({
      edgeType: edge.type,
      toEntryId: edgeTargets.get(edge.toSlug)!,
      payload: edge.payload ?? null,
    })),
  });

  await embedCodexEntrySafe(entry, kind);

  return entry;
}
