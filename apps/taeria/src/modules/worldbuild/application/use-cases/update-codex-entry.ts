import type { CodexEntry } from "../../domain/codex-entry";
import { CODEX_ERRORS } from "../../domain/errors";
import { STORED_FACET_TYPES } from "../../domain/facet-type";
import { getCodexRepository } from "../../infrastructure/codex.repository.factory";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import { embedCodexEntrySafe } from "../ai/embed-entry";
import type { CodexEntryPayload } from "../schemas/validate-codex-entry";
import { validateCodexEntry } from "../schemas/validate-codex-entry";

export async function updateCodexEntry(
  id: string,
  payload: CodexEntryPayload,
): Promise<CodexEntry> {
  const codexRepo = await getCodexRepository();
  const existing = await codexRepo.findById(id);
  if (!existing) {
    throw CODEX_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  const kindRepo = await getKindRepository();
  const kind = await kindRepo.findById(existing.kindId);
  if (!kind) {
    throw CODEX_ERRORS.create("KIND_NOT_FOUND", {
      meta: { kindId: existing.kindId },
    });
  }

  const validation = validateCodexEntry(payload, kind);
  if (!validation.valid) {
    throw CODEX_ERRORS.create("VALIDATION_FAILED", {
      meta: {
        errors: validation.errors,
        identityErrors: validation.identityErrors,
      },
    });
  }

  if (await codexRepo.slugExists(payload.slug, id)) {
    throw CODEX_ERRORS.create("SLUG_TAKEN", { meta: { slug: payload.slug } });
  }

  const facets = STORED_FACET_TYPES.filter((facetType) => {
    const config = kind.facets.find((facet) => facet.facetType === facetType);
    return config?.enabled && payload.facets[facetType];
  }).map((facetType) => ({
    facetType,
    data: payload.facets[facetType]!,
  }));

  const edgeTargets = new Map<string, string>();
  for (const edge of payload.edges) {
    const target = await codexRepo.findBySlug(edge.toSlug);
    if (!target) {
      throw CODEX_ERRORS.create("NOT_FOUND", {
        meta: { slug: edge.toSlug, context: "edge_target" },
      });
    }
    edgeTargets.set(edge.toSlug, target.id);
  }

  const updated = await codexRepo.update(id, {
    title: payload.title,
    slug: payload.slug,
    ...(payload.visibility !== undefined
      ? { visibility: payload.visibility }
      : {}),
    ...(payload.sharedUserIds !== undefined
      ? { sharedUserIds: payload.sharedUserIds }
      : {}),
    facets,
    edges: payload.edges.map((edge) => ({
      edgeType: edge.type,
      toEntryId: edgeTargets.get(edge.toSlug)!,
      payload: edge.payload ?? null,
    })),
  });

  if (!updated) {
    throw CODEX_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  await embedCodexEntrySafe(updated, kind);

  return updated;
}
