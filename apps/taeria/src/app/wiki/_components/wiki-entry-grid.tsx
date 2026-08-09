import type { CodexEntrySummary } from "@/modules/worldbuild/domain/codex-entry";
import type { EntryCardMeta } from "./load-entry-card-meta";
import { WikiHubCard } from "./wiki-hub-card";
import { wikiCardGridClassName } from "./wiki-utils";

type WikiEntryGridProps = {
  entries: CodexEntrySummary[];
  cardMetaMap: Map<string, EntryCardMeta>;
  kindNameBySlug: Map<string, string>;
};

function WikiEntryGrid({
  entries,
  cardMetaMap,
  kindNameBySlug,
}: WikiEntryGridProps) {
  return (
    <div className={wikiCardGridClassName}>
      {entries.map((entry) => {
        const meta = cardMetaMap.get(entry.id);
        return (
          <WikiHubCard
            key={entry.id}
            slug={entry.slug}
            title={entry.title}
            kindSlug={entry.kindSlug}
            kindName={kindNameBySlug.get(entry.kindSlug) ?? entry.kindSlug}
            excerpt={meta?.loreExcerpt ?? null}
            bannerUrl={meta?.bannerUrl}
          />
        );
      })}
    </div>
  );
}

export { WikiEntryGrid };
