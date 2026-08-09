import type { CodexEntrySummary } from "@/modules/worldbuild/domain/codex-entry";
import type { WikiKindTreeBrowse } from "@/modules/worldbuild/application/use-cases/get-wiki-kind-tree-browse";
import type { EntryCardMeta } from "./load-entry-card-meta";
import { WikiEntryGrid } from "./wiki-entry-grid";
import { WikiEquipamentoBrowse } from "./wiki-equipamento-browse";
import { WikiRecipeBrowse } from "./wiki-recipe-browse";
import { WikiTaxonomyTree } from "./wiki-taxonomy-tree";

type WikiKindBrowseViewProps = {
  browse: WikiKindTreeBrowse;
  cardMetaMap: Map<string, EntryCardMeta>;
  kindNameBySlug: Map<string, string>;
  entries?: CodexEntrySummary[];
};

function WikiKindBrowseView({
  browse,
  cardMetaMap,
  kindNameBySlug,
  entries = browse.entries,
}: WikiKindBrowseViewProps) {
  const { browseMode, tree } = browse;

  if (tree && (browseMode === "tree" || browseMode === "treeGrouped")) {
    return <WikiTaxonomyTree tree={tree} />;
  }

  if (browseMode === "recipe") {
    return <WikiRecipeBrowse entries={entries} cardMetaMap={cardMetaMap} />;
  }

  if (browseMode === "equipamento") {
    return (
      <WikiEquipamentoBrowse
        entries={entries}
        cardMetaMap={cardMetaMap}
        kindNameBySlug={kindNameBySlug}
      />
    );
  }

  return (
    <WikiEntryGrid
      entries={entries}
      cardMetaMap={cardMetaMap}
      kindNameBySlug={kindNameBySlug}
    />
  );
}

export { WikiKindBrowseView };
