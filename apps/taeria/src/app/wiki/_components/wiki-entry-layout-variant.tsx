import type { WikiEntryLayout } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import type { WikiEntryTaxonomyContext } from "@/modules/worldbuild/application/use-cases/get-wiki-entry-by-slug";
import type { WikiEntryLayoutMode } from "@/modules/worldbuild/application/wiki/wiki-kind-config";
import {
  getWikiBrowseMode,
  type WikiBrowseMode,
} from "@/modules/worldbuild/application/wiki/wiki-kind-config";
import { WikiEntryBody } from "./wiki-entry-body";
import { WikiEntrySidebar } from "./wiki-entry-sidebar";
import { WikiRecipePanel } from "./wiki-recipe-panel";
import { WikiStatBlock } from "./wiki-stat-block";
import { WikiTaxonomyBreadcrumb } from "./wiki-taxonomy-breadcrumb";
import { WikiTechniqueSheet } from "./wiki-technique-sheet";

const SIDEBAR_KEYS_BY_MODE: Partial<
  Record<WikiEntryLayoutMode, readonly string[]>
> = {
  statBlock: ["nivel", "reflexo", "constituicao", "mente"],
  technique: ["intencao", "alvo", "nivel"],
  recipe: ["insumos", "saida", "habilidade_minima"],
  lexicon: ["term", "translation"],
};

type WikiEntryLayoutVariantProps = {
  mode: WikiEntryLayoutMode;
  kindSlug: string;
  entryTitle: string;
  layout: WikiEntryLayout;
  taxonomy: WikiEntryTaxonomyContext;
};

function shouldShowTaxonomyBreadcrumb(
  browseMode: WikiBrowseMode,
  taxonomy: WikiEntryTaxonomyContext,
): boolean {
  return (
    (browseMode === "tree" || browseMode === "treeGrouped") &&
    taxonomy.ancestors.length > 0
  );
}

function filterLayoutForMode(
  layout: WikiEntryLayout,
  mode: WikiEntryLayoutMode,
): WikiEntryLayout {
  const hiddenKeys = new Set(SIDEBAR_KEYS_BY_MODE[mode] ?? []);
  if (hiddenKeys.size === 0) {
    return layout;
  }

  return {
    ...layout,
    sidebar: layout.sidebar.filter((field) => !hiddenKeys.has(field.key)),
    hero: layout.hero.filter((field) => !hiddenKeys.has(field.key)),
  };
}

function WikiEntryLayoutVariant({
  mode,
  kindSlug,
  entryTitle,
  layout,
  taxonomy,
}: WikiEntryLayoutVariantProps) {
  const filteredLayout = filterLayoutForMode(layout, mode);
  const browseMode = getWikiBrowseMode(kindSlug);
  const showBreadcrumb = shouldShowTaxonomyBreadcrumb(browseMode, taxonomy);

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-8">
        {mode === "statBlock" ? (
          <WikiStatBlock fields={layout.sidebar} />
        ) : null}
        {mode === "technique" ? (
          <WikiTechniqueSheet
            fields={layout.sidebar}
            derivedTechniques={taxonomy.children}
          />
        ) : null}
        {mode === "recipe" ? <WikiRecipePanel fields={layout.sidebar} /> : null}

        <WikiEntryBody
          layout={filteredLayout}
          proseDominant={mode === "reading"}
          etymologyNote={mode === "lexicon"}
        />
      </div>

      {showBreadcrumb ||
      filteredLayout.sidebar.length > 0 ||
      filteredLayout.sidebarEdges.length > 0 ? (
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {showBreadcrumb ? (
            <div className="border-border bg-muted/20 rounded-xl border p-5">
              <WikiTaxonomyBreadcrumb
                ancestors={taxonomy.ancestors}
                currentTitle={entryTitle}
              />
            </div>
          ) : null}
          <WikiEntrySidebar layout={filteredLayout} />
        </aside>
      ) : null}
    </div>
  );
}

export { WikiEntryLayoutVariant };
