"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import type {
  WikiTaxonomyGroupedSection,
  WikiTaxonomyNode,
  WikiTaxonomyTree,
} from "@/modules/worldbuild/application/wiki/build-wiki-taxonomy-tree";
import { cn } from "@/common/utils/cn";

type WikiTaxonomyTreeProps = {
  tree: WikiTaxonomyTree;
};

function WikiTaxonomyTreeNode({
  node,
  depth = 0,
}: {
  node: WikiTaxonomyNode;
  depth?: number;
}) {
  const hasChildren = node.children.length > 0;

  if (!hasChildren) {
    return (
      <li className="list-none">
        <Link
          href={`/wiki/${node.entry.slug}`}
          className="text-foreground hover:text-primary inline-flex min-h-9 items-center rounded-md px-2 text-base transition-colors hover:underline"
          style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
        >
          {node.entry.title}
        </Link>
      </li>
    );
  }

  return (
    <li className="list-none">
      <details open className="group/details">
        <summary
          className={cn(
            "flex min-h-9 cursor-pointer list-none items-center gap-1 rounded-md px-2 text-base marker:content-none",
            "[&::-webkit-details-marker]:hidden",
          )}
          style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
        >
          <ChevronRightIcon className="text-muted-foreground size-4 shrink-0 transition-transform group-open/details:rotate-90" />
          <Link
            href={`/wiki/${node.entry.slug}`}
            className="font-medium hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {node.entry.title}
          </Link>
        </summary>
        <ul className="border-border/60 mt-1 space-y-0.5 border-l pl-2">
          {node.children.map((child) => (
            <WikiTaxonomyTreeNode
              key={child.entry.id}
              node={child}
              depth={depth + 1}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

function WikiTaxonomyTreeSection({
  section,
}: {
  section: WikiTaxonomyGroupedSection;
}) {
  return (
    <section
      className="space-y-3"
      aria-labelledby={`wiki-tree-${section.groupEntry.id}`}
    >
      <h2
        id={`wiki-tree-${section.groupEntry.id}`}
        className="font-display text-lg"
      >
        {section.groupEntry.slug.startsWith("outras-") ? (
          section.groupEntry.title
        ) : (
          <Link
            href={`/wiki/${section.groupEntry.slug}`}
            className="hover:underline"
          >
            {section.groupEntry.title}
          </Link>
        )}
      </h2>
      <ul className="space-y-1">
        {section.roots.map((root) => (
          <WikiTaxonomyTreeNode key={root.entry.id} node={root} />
        ))}
      </ul>
    </section>
  );
}

function WikiTaxonomyTree({ tree }: WikiTaxonomyTreeProps) {
  if (tree.mode === "treeGrouped") {
    return (
      <div className="space-y-8">
        {tree.groups.map((section) => (
          <WikiTaxonomyTreeSection
            key={section.groupEntry.id}
            section={section}
          />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {tree.roots.map((root) => (
        <WikiTaxonomyTreeNode key={root.entry.id} node={root} />
      ))}
    </ul>
  );
}

export { WikiTaxonomyTree };
