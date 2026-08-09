import Link from "next/link";

import type { WikiKindSummary } from "@/modules/worldbuild/domain/wiki-codex.repository";
import { kindGradientStyle } from "./wiki-utils";

type WikiKindCardProps = {
  kind: WikiKindSummary;
};

function WikiKindCard({ kind }: WikiKindCardProps) {
  const entryLabel = kind.entryCount === 1 ? "entrada" : "entradas";

  return (
    <Link href={`/wiki/kinds/${kind.slug}`} className="group block h-full">
      <article className="border-border group-hover:border-primary/40 flex h-full flex-col overflow-hidden rounded-xl border transition-colors">
        <div
          className="relative aspect-[2/1] overflow-hidden"
          style={kindGradientStyle(kind.slug)}
        />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-lg font-medium">{kind.name}</h2>
            <span className="text-muted-foreground shrink-0 text-sm">
              {kind.entryCount} {entryLabel}
            </span>
          </div>
          {kind.description ? (
            <p className="text-muted-foreground line-clamp-2 text-base">
              {kind.description}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export { WikiKindCard };
