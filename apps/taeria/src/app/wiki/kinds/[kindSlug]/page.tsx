import { notFound } from "next/navigation";

import type { CodexEntrySummary } from "@/modules/worldbuild/domain/codex-entry";
import { getWikiKindTreeBrowse } from "@/modules/worldbuild/application/use-cases/get-wiki-kind-tree-browse";
import { listWikiKindIndex } from "@/modules/worldbuild/application/use-cases/get-wiki-kind-browse";
import { loadEntryCardMeta } from "../../_components/load-entry-card-meta";
import type { EntryCardMeta } from "../../_components/load-entry-card-meta";
import { WikiEmptyState } from "../../_components/wiki-empty-state";
import { WikiKindBrowseView } from "../../_components/wiki-kind-browse-view";
import { WikiKindNav } from "../../_components/wiki-kind-nav";

type WikiKindBrowsePageProps = {
  params: Promise<{ kindSlug: string }>;
  searchParams: Promise<{ q?: string }>;
};

function sortEntriesForKind(
  kindSlug: string,
  entries: CodexEntrySummary[],
  cardMetaMap: Map<string, EntryCardMeta>,
): CodexEntrySummary[] {
  if (kindSlug !== "termo") {
    return entries;
  }

  return [...entries].sort((left, right) => {
    const leftTerm = cardMetaMap.get(left.id)?.lexiconTerm ?? left.title;
    const rightTerm = cardMetaMap.get(right.id)?.lexiconTerm ?? right.title;
    return leftTerm.localeCompare(rightTerm, "pt-BR");
  });
}

export default async function WikiKindBrowsePage({
  params,
  searchParams,
}: WikiKindBrowsePageProps) {
  const { kindSlug } = await params;
  const { q } = await searchParams;

  const browse = await getWikiKindTreeBrowse(kindSlug, {
    query: q,
    limit: q ? 24 : 500,
  });
  if (!browse) {
    notFound();
  }

  const { kind, total } = browse;
  const [cardMetaMap, kindIndex] = await Promise.all([
    loadEntryCardMeta(browse.entries.map((entry) => entry.id)),
    listWikiKindIndex(),
  ]);
  const kindNameBySlug = new Map(
    kindIndex.map((item) => [item.slug, item.name]),
  );
  const entries = sortEntriesForKind(kindSlug, browse.entries, cardMetaMap);

  return (
    <div className="space-y-8">
      <WikiKindNav kindName={kind.name} />

      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-tight">{kind.name}</h1>
        {kind.description ? (
          <p className="text-muted-foreground max-w-2xl text-base">
            {kind.description}
          </p>
        ) : null}
        <p className="text-muted-foreground text-sm">
          {total} {total === 1 ? "entrada" : "entradas"}
          {q ? ` para “${q}”` : ""}
        </p>
      </div>

      {entries.length === 0 ? (
        <WikiEmptyState variant={q ? "no-results" : "empty"} />
      ) : (
        <WikiKindBrowseView
          browse={{ ...browse, entries }}
          entries={entries}
          cardMetaMap={cardMetaMap}
          kindNameBySlug={kindNameBySlug}
        />
      )}
    </div>
  );
}
