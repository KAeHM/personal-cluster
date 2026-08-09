import Link from "next/link";

import type { WikiTaxonomyEdgeTarget } from "@/modules/worldbuild/domain/wiki-codex.repository";

type WikiTaxonomyBreadcrumbProps = {
  ancestors: WikiTaxonomyEdgeTarget[];
  currentTitle: string;
};

function WikiTaxonomyBreadcrumb({
  ancestors,
  currentTitle,
}: WikiTaxonomyBreadcrumbProps) {
  if (ancestors.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Taxonomia" className="space-y-2">
      <p className="text-muted-foreground text-sm font-medium">Taxonomia</p>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        {ancestors.map((ancestor, index) => (
          <li key={ancestor.id} className="flex items-center gap-1">
            {index > 0 ? <span aria-hidden>/</span> : null}
            <Link href={`/wiki/${ancestor.slug}`} className="hover:underline">
              {ancestor.title}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-1">
          <span aria-hidden>/</span>
          <span className="text-foreground">{currentTitle}</span>
        </li>
      </ol>
    </nav>
  );
}

export { WikiTaxonomyBreadcrumb };
