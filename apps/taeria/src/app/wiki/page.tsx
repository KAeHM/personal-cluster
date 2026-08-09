import { redirect } from "next/navigation";

import { listWikiEntries } from "@/modules/worldbuild/application/use-cases/get-wiki-entry-by-slug";
import { listWikiKindIndex } from "@/modules/worldbuild/application/use-cases/get-wiki-kind-browse";
import { loadEntryCardMeta } from "./_components/load-entry-card-meta";
import { WikiEmptyState } from "./_components/wiki-empty-state";
import { WikiEntryGrid } from "./_components/wiki-entry-grid";
import { WikiHubKindSections } from "./_components/wiki-hub-kind-sections";

type WikiHubPageProps = {
  searchParams: Promise<{ q?: string; kind?: string }>;
};

export default async function WikiHubPage({ searchParams }: WikiHubPageProps) {
  const { q, kind } = await searchParams;

  if (kind && kind !== "all") {
    const params = new URLSearchParams();
    if (q) {
      params.set("q", q);
    }
    const query = params.size > 0 ? `?${params.toString()}` : "";
    redirect(`/wiki/kinds/${encodeURIComponent(kind)}${query}`);
  }

  const [{ entries, total }, kindIndex] = await Promise.all([
    listWikiEntries({ query: q, limit: 24 }),
    listWikiKindIndex(),
  ]);

  const kindNameBySlug = new Map(
    kindIndex.map((item) => [item.slug, item.name]),
  );
  const cardMetaMap = await loadEntryCardMeta(entries.map((entry) => entry.id));

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl tracking-tight">Worldbuild</h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          Navegue por história, mundo, regras do sistema e referência — o
          worldbuild de Taeria que o Mestre tornou público ou compartilhou com
          você, incluindo termos do léxico antigo.
        </p>
      </div>

      {kindIndex.length > 0 ? (
        <WikiHubKindSections kindIndex={kindIndex} />
      ) : null}

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-display text-xl">Todas as entradas</h2>
          {entries.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {total} {total === 1 ? "entrada" : "entradas"}
              {q ? ` para “${q}”` : ""}
            </p>
          ) : null}
        </div>

        {entries.length === 0 ? (
          <WikiEmptyState variant={q ? "no-results" : "empty"} />
        ) : (
          <WikiEntryGrid
            entries={entries}
            cardMetaMap={cardMetaMap}
            kindNameBySlug={kindNameBySlug}
          />
        )}
      </section>
    </div>
  );
}
