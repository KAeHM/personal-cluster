import type { CodexEdgeWithTarget, CodexEntry } from "../../domain/codex-entry";
import { CODEX_ERRORS } from "../../domain/errors";
import { getCodexRepository } from "../../infrastructure/codex.repository.factory";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import type { Kind } from "../../domain/kind";

export async function getCodexEntry(id: string) {
  const repo = await getCodexRepository();
  const entry = await repo.findById(id);
  if (!entry) {
    throw CODEX_ERRORS.create("NOT_FOUND", { meta: { id } });
  }
  return entry;
}

export async function getCodexEntryBySlug(slug: string) {
  const repo = await getCodexRepository();
  const entry = await repo.findBySlug(slug);
  if (!entry) {
    throw CODEX_ERRORS.create("NOT_FOUND", { meta: { slug } });
  }
  return entry;
}

export interface CodexEntryDetail {
  entry: CodexEntry;
  kind: Kind;
  edgesWithTargets: CodexEdgeWithTarget[];
}

export async function getCodexEntryDetail(
  id: string,
): Promise<CodexEntryDetail> {
  const entry = await getCodexEntry(id);
  const kindRepo = await getKindRepository();
  const kind = await kindRepo.findById(entry.kindId);
  if (!kind) {
    throw CODEX_ERRORS.create("KIND_NOT_FOUND", {
      meta: { kindId: entry.kindId },
    });
  }

  const codexRepo = await getCodexRepository();
  const targetIds = [...new Set(entry.edges.map((edge) => edge.toEntryId))];
  const targets = await Promise.all(
    targetIds.map((targetId) => codexRepo.findById(targetId)),
  );
  const targetById = new Map(
    targets
      .filter((target): target is CodexEntry => target !== null)
      .map((target) => [target.id, target]),
  );

  const edgesWithTargets: CodexEdgeWithTarget[] = entry.edges.map((edge) => {
    const target = targetById.get(edge.toEntryId);
    return {
      ...edge,
      toEntry: target
        ? { id: target.id, slug: target.slug, title: target.title }
        : null,
    };
  });

  return { entry, kind, edgesWithTargets };
}
