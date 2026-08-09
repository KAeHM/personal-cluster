import type { CodexEntrySummary } from "../../domain/codex-entry";
import type { WikiKindSummary } from "../../domain/wiki-codex.repository";
import { getWikiCodexRepository } from "../../infrastructure/wiki-codex.repository.factory";

export type WikiKindBrowse = {
  kind: WikiKindSummary;
  entries: CodexEntrySummary[];
  total: number;
};

export async function listWikiKindIndex(): Promise<WikiKindSummary[]> {
  const wikiRepo = await getWikiCodexRepository();
  return wikiRepo.listVisibleKinds();
}

export async function getWikiKindBrowse(
  kindSlug: string,
  params: {
    query?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<WikiKindBrowse | null> {
  const wikiRepo = await getWikiCodexRepository();
  const kind = await wikiRepo.findKindBySlug(kindSlug);
  if (!kind) {
    return null;
  }

  const { entries, total } = await wikiRepo.list({
    ...params,
    kindSlug,
  });

  return {
    kind: { ...kind, entryCount: total },
    entries,
    total,
  };
}
