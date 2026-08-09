import type { WikiTaxonomyEdge } from "../../domain/wiki-codex.repository";

export type WikiTaxonomyEntryRef = {
  id: string;
  slug: string;
  title: string;
  kindSlug: string;
};

export type WikiTaxonomyBuildEntry = WikiTaxonomyEntryRef & {
  systemData?: Record<string, unknown>;
};

export type WikiTaxonomyNode = {
  entry: WikiTaxonomyEntryRef;
  children: WikiTaxonomyNode[];
};

export type WikiTaxonomyGroupedSection = {
  groupEntry: WikiTaxonomyEntryRef;
  roots: WikiTaxonomyNode[];
};

export type WikiTaxonomyTree =
  | {
      mode: "tree";
      roots: WikiTaxonomyNode[];
    }
  | {
      mode: "treeGrouped";
      groups: WikiTaxonomyGroupedSection[];
    };

export type BuildWikiTaxonomyTreeInput = {
  kindSlug: string;
  mode: "tree" | "treeGrouped";
  entries: WikiTaxonomyBuildEntry[];
  edges: WikiTaxonomyEdge[];
  /** Kind do agrupador em treeGrouped (ex.: escola, taxon). Default: escola. */
  groupParentKindSlug?: string;
  ungroupedSlug?: string;
  ungroupedTitle?: string;
};

type EdgesByChildId = Map<string, WikiTaxonomyEdge[]>;

function toRef(entry: WikiTaxonomyBuildEntry): WikiTaxonomyEntryRef {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    kindSlug: entry.kindSlug,
  };
}

function indexEdgesByChild(edges: WikiTaxonomyEdge[]): EdgesByChildId {
  const map: EdgesByChildId = new Map();

  for (const edge of edges) {
    const existing = map.get(edge.childEntryId) ?? [];
    existing.push(edge);
    map.set(edge.childEntryId, existing);
  }

  return map;
}

function edgesForChild(
  edgesByChildId: EdgesByChildId,
  childId: string,
): WikiTaxonomyEdge[] {
  return edgesByChildId.get(childId) ?? [];
}

function sameKindParentEdge(
  edgesByChildId: EdgesByChildId,
  entryId: string,
  kindSlug: string,
  entryIds: Set<string>,
): WikiTaxonomyEdge | null {
  for (const edge of edgesForChild(edgesByChildId, entryId)) {
    if (edge.parent.kindSlug === kindSlug && entryIds.has(edge.parent.id)) {
      return edge;
    }
  }

  return null;
}

function parseNumericField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function compareSiblings(
  left: WikiTaxonomyBuildEntry,
  right: WikiTaxonomyBuildEntry,
  edgesByChildId: EdgesByChildId,
  kindSlug: string,
  entryIds: Set<string>,
): number {
  const leftEdge = sameKindParentEdge(
    edgesByChildId,
    left.id,
    kindSlug,
    entryIds,
  );
  const rightEdge = sameKindParentEdge(
    edgesByChildId,
    right.id,
    kindSlug,
    entryIds,
  );

  const leftRank = parseNumericField(leftEdge?.payload?.rank ?? null);
  const rightRank = parseNumericField(rightEdge?.payload?.rank ?? null);

  if (leftRank !== null || rightRank !== null) {
    if (leftRank === null) {
      return 1;
    }
    if (rightRank === null) {
      return -1;
    }
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
  }

  const leftOrdem = parseNumericField(left.systemData?.ordem);
  const rightOrdem = parseNumericField(right.systemData?.ordem);

  if (leftOrdem !== null || rightOrdem !== null) {
    if (leftOrdem === null) {
      return 1;
    }
    if (rightOrdem === null) {
      return -1;
    }
    if (leftOrdem !== rightOrdem) {
      return leftOrdem - rightOrdem;
    }
  }

  return left.title.localeCompare(right.title, "pt-BR");
}

function sortEntries(
  entries: WikiTaxonomyBuildEntry[],
  edgesByChildId: EdgesByChildId,
  kindSlug: string,
  entryIds: Set<string>,
): WikiTaxonomyBuildEntry[] {
  return [...entries].sort((left, right) =>
    compareSiblings(left, right, edgesByChildId, kindSlug, entryIds),
  );
}

function buildSameKindSubtree(input: {
  kindSlug: string;
  entries: WikiTaxonomyBuildEntry[];
  edgesByChildId: EdgesByChildId;
  entryIds: Set<string>;
  isRoot: (entry: WikiTaxonomyBuildEntry) => boolean;
  childPredicate: (
    entry: WikiTaxonomyBuildEntry,
    parent: WikiTaxonomyBuildEntry,
  ) => boolean;
}): WikiTaxonomyNode[] {
  const {
    kindSlug,
    entries,
    edgesByChildId,
    entryIds,
    isRoot,
    childPredicate,
  } = input;

  function buildNode(entry: WikiTaxonomyBuildEntry): WikiTaxonomyNode {
    const children = sortEntries(
      entries.filter((candidate) => childPredicate(candidate, entry)),
      edgesByChildId,
      kindSlug,
      entryIds,
    ).map(buildNode);

    return {
      entry: toRef(entry),
      children,
    };
  }

  return sortEntries(
    entries.filter(isRoot),
    edgesByChildId,
    kindSlug,
    entryIds,
  ).map(buildNode);
}

function findGroupAncestor(
  entryId: string,
  edgesByChildId: EdgesByChildId,
  groupParentKindSlug: string,
  visited = new Set<string>(),
): WikiTaxonomyEntryRef | null {
  if (visited.has(entryId)) {
    return null;
  }
  visited.add(entryId);

  for (const edge of edgesForChild(edgesByChildId, entryId)) {
    if (edge.parent.kindSlug === groupParentKindSlug) {
      return edge.parent;
    }

    const nested = findGroupAncestor(
      edge.parent.id,
      edgesByChildId,
      groupParentKindSlug,
      visited,
    );
    if (nested) {
      return nested;
    }
  }

  return null;
}

function buildTreeForest(
  input: BuildWikiTaxonomyTreeInput,
): WikiTaxonomyNode[] {
  const { kindSlug, entries, edges } = input;
  const entryIds = new Set(entries.map((entry) => entry.id));
  const edgesByChildId = indexEdgesByChild(edges);

  return buildSameKindSubtree({
    kindSlug,
    entries,
    edgesByChildId,
    entryIds,
    isRoot(entry) {
      return (
        sameKindParentEdge(edgesByChildId, entry.id, kindSlug, entryIds) ===
        null
      );
    },
    childPredicate(candidate, parent) {
      const edge = sameKindParentEdge(
        edgesByChildId,
        candidate.id,
        kindSlug,
        entryIds,
      );
      return edge?.parent.id === parent.id;
    },
  });
}

function buildGroupedForest(
  input: BuildWikiTaxonomyTreeInput,
): WikiTaxonomyGroupedSection[] {
  const { kindSlug, entries, edges } = input;
  const groupParentKindSlug = input.groupParentKindSlug ?? "escola";
  const ungroupedSlug = input.ungroupedSlug ?? "outras-habilidades";
  const ungroupedTitle = input.ungroupedTitle ?? "Outras habilidades";
  const edgesByChildId = indexEdgesByChild(edges);

  const entriesByGroupId = new Map<string, WikiTaxonomyBuildEntry[]>();
  const groupEntryById = new Map<string, WikiTaxonomyEntryRef>();
  const ungrouped: WikiTaxonomyBuildEntry[] = [];

  for (const entry of entries) {
    const group = findGroupAncestor(
      entry.id,
      edgesByChildId,
      groupParentKindSlug,
    );

    if (!group) {
      ungrouped.push(entry);
      continue;
    }

    groupEntryById.set(group.id, group);
    const groupEntries = entriesByGroupId.get(group.id) ?? [];
    groupEntries.push(entry);
    entriesByGroupId.set(group.id, groupEntries);
  }

  const groups: WikiTaxonomyGroupedSection[] = [];

  for (const [groupId, groupEntries] of entriesByGroupId) {
    const groupEntry = groupEntryById.get(groupId);
    if (!groupEntry) {
      continue;
    }

    const groupIds = new Set(groupEntries.map((entry) => entry.id));

    groups.push({
      groupEntry,
      roots: buildSameKindSubtree({
        kindSlug,
        entries: groupEntries,
        edgesByChildId,
        entryIds: groupIds,
        isRoot(entry) {
          const parentEdge = sameKindParentEdge(
            edgesByChildId,
            entry.id,
            kindSlug,
            groupIds,
          );
          if (!parentEdge) {
            return true;
          }
          return !groupIds.has(parentEdge.parent.id);
        },
        childPredicate(candidate, parent) {
          const edge = sameKindParentEdge(
            edgesByChildId,
            candidate.id,
            kindSlug,
            groupIds,
          );
          return edge?.parent.id === parent.id;
        },
      }),
    });
  }

  groups.sort((left, right) =>
    left.groupEntry.title.localeCompare(right.groupEntry.title, "pt-BR"),
  );

  if (ungrouped.length > 0) {
    const groupIds = new Set(ungrouped.map((entry) => entry.id));
    groups.push({
      groupEntry: {
        id: "__ungrouped__",
        slug: ungroupedSlug,
        title: ungroupedTitle,
        kindSlug: groupParentKindSlug,
      },
      roots: buildSameKindSubtree({
        kindSlug,
        entries: ungrouped,
        edgesByChildId,
        entryIds: groupIds,
        isRoot(entry) {
          const parentEdge = sameKindParentEdge(
            edgesByChildId,
            entry.id,
            kindSlug,
            groupIds,
          );
          if (!parentEdge) {
            return true;
          }
          return !groupIds.has(parentEdge.parent.id);
        },
        childPredicate(candidate, parent) {
          const edge = sameKindParentEdge(
            edgesByChildId,
            candidate.id,
            kindSlug,
            groupIds,
          );
          return edge?.parent.id === parent.id;
        },
      }),
    });
  }

  return groups;
}

export function buildWikiTaxonomyTree(
  input: BuildWikiTaxonomyTreeInput,
): WikiTaxonomyTree {
  if (input.mode === "treeGrouped") {
    return {
      mode: "treeGrouped",
      groups: buildGroupedForest(input),
    };
  }

  return {
    mode: "tree",
    roots: buildTreeForest(input),
  };
}
