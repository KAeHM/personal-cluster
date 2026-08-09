import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { CodexEntrySummary } from "@/modules/worldbuild/domain/codex-entry";
import type { EntryCardMeta } from "./load-entry-card-meta";
import { wikiCardGridClassName } from "./wiki-utils";

type WikiRecipeBrowseProps = {
  entries: CodexEntrySummary[];
  cardMetaMap: Map<string, EntryCardMeta>;
};

function WikiRecipeBrowse({ entries, cardMetaMap }: WikiRecipeBrowseProps) {
  return (
    <div className={wikiCardGridClassName}>
      {entries.map((entry) => {
        const preview = cardMetaMap.get(entry.id)?.systemPreview;

        return (
          <Link
            key={entry.id}
            href={`/wiki/${entry.slug}`}
            className="group block h-full"
          >
            <article className="border-border group-hover:border-primary/40 flex h-full flex-col gap-4 rounded-xl border p-4 transition-colors">
              <h2 className="font-display text-lg font-medium group-hover:underline">
                {entry.title}
              </h2>
              <div className="text-muted-foreground flex flex-1 flex-col justify-center gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-muted rounded-md px-2 py-1">
                    {preview?.insumos ?? "Insumos não informados"}
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
                  <span className="bg-muted rounded-md px-2 py-1">
                    {preview?.saida ?? "Saída não informada"}
                  </span>
                </div>
                {preview?.habilidadeMinima ? (
                  <p>
                    Requer{" "}
                    <span className="text-foreground">
                      {preview.habilidadeMinima}
                    </span>
                  </p>
                ) : null}
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}

export { WikiRecipeBrowse };
