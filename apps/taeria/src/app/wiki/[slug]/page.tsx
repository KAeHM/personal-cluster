import { notFound } from "next/navigation";

import { getWikiEntryBySlug } from "@/modules/worldbuild/application/use-cases/get-wiki-entry-by-slug";
import { listWikiKindIndex } from "@/modules/worldbuild/application/use-cases/get-wiki-kind-browse";
import { WikiEntryContentTransition } from "../_components/wiki-entry-content-transition";
import { WikiEntryLayoutVariant } from "../_components/wiki-entry-layout-variant";
import { WikiEntryNav } from "../_components/wiki-entry-nav";
import { WikiEntryRelated } from "../_components/wiki-entry-related";
import { WikiEntryScrollView } from "../_components/wiki-entry-scroll-view";

type WikiEntryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WikiEntryPage({ params }: WikiEntryPageProps) {
  const { slug } = await params;
  const detail = await getWikiEntryBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { entry, kind, layout, layoutMode, taxonomy } = detail;
  const kindIndex = await listWikiKindIndex();
  const kindNameBySlug = new Map(
    kindIndex.map((item) => [item.slug, item.name]),
  );
  const compactHero = layoutMode === "reading" || layoutMode === "lexicon";

  return (
    <WikiEntryScrollView
      title={entry.title}
      kindName={kind.name}
      kindSlug={kind.slug}
      layout={layout}
      compactHero={compactHero}
    >
      <WikiEntryNav
        kindName={kind.name}
        kindSlug={kind.slug}
        title={entry.title}
      />

      <WikiEntryContentTransition>
        <WikiEntryLayoutVariant
          mode={layoutMode}
          kindSlug={kind.slug}
          entryTitle={entry.title}
          layout={layout}
          taxonomy={taxonomy}
        />
      </WikiEntryContentTransition>

      {layout.related.length > 0 ? (
        <WikiEntryContentTransition delay={0.08}>
          <div className="mx-auto max-w-6xl px-4 pb-16">
            <WikiEntryRelated
              related={layout.related}
              kindNameBySlug={kindNameBySlug}
            />
          </div>
        </WikiEntryContentTransition>
      ) : null}
    </WikiEntryScrollView>
  );
}
