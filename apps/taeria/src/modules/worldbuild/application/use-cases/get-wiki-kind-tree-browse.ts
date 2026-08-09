import type { CodexEntrySummary } from "../../domain/codex-entry";
import type { WikiKindSummary } from "../../domain/wiki-codex.repository";
import {
  buildWikiTaxonomyTree,
  type WikiTaxonomyTree,
} from "../wiki/build-wiki-taxonomy-tree";
import {
  getWikiBrowseMode,
  type WikiBrowseMode,
} from "../wiki/wiki-kind-config";
import { getWikiCodexRepository } from "../../infrastructure/wiki-codex.repository.factory";
import { getWikiKindBrowse } from "./get-wiki-kind-browse";

export type WikiKindTreeBrowse = {
  kind: WikiKindSummary;
  browseMode: WikiBrowseMode;
  entries: CodexEntrySummary[];
  total: number;
  tree: WikiTaxonomyTree | null;
};

/** Espécies de jogo agrupadas por taxon via classified_as. */
const SPECIES_SHEET_KINDS = new Set(["criatura", "planta"]);

async function loadEntrySystemData(
  entryIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  if (entryIds.length === 0) {
    return new Map();
  }

  const wikiRepo = await getWikiCodexRepository();
  const entries = await wikiRepo.findByIds(entryIds);
  const systemDataByEntryId = new Map<string, Record<string, unknown>>();

  for (const entry of entries) {
    const systemFacet = entry.facets.find(
      (facet) => facet.facetType === "system",
    );
    if (systemFacet?.data) {
      systemDataByEntryId.set(entry.id, systemFacet.data);
    }
  }

  return systemDataByEntryId;
}

export async function getWikiKindTreeBrowse(
  kindSlug: string,
  params: {
    query?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<WikiKindTreeBrowse | null> {
  const browse = await getWikiKindBrowse(kindSlug, params);
  if (!browse) {
    return null;
  }

  const browseMode = getWikiBrowseMode(kindSlug);
  const hasQuery = Boolean(params.query?.trim());

  if (hasQuery || (browseMode !== "tree" && browseMode !== "treeGrouped")) {
    return {
      kind: browse.kind,
      browseMode: hasQuery ? "grid" : browseMode,
      entries: browse.entries,
      total: browse.total,
      tree: null,
    };
  }

  const wikiRepo = await getWikiCodexRepository();
  const isSpeciesSheet = SPECIES_SHEET_KINDS.has(kindSlug);
  const edges = isSpeciesSheet
    ? await wikiRepo.listClassifiedAsEdgesForKind(kindSlug)
    : await wikiRepo.listTaxonomyEdgesForKind(kindSlug);

  if (edges.length === 0) {
    return {
      kind: browse.kind,
      browseMode: "grid",
      entries: browse.entries,
      total: browse.total,
      tree: null,
    };
  }

  const systemDataByEntryId = await loadEntrySystemData(
    browse.entries.map((entry) => entry.id),
  );

  const tree = buildWikiTaxonomyTree({
    kindSlug,
    mode: browseMode === "treeGrouped" ? "treeGrouped" : "tree",
    entries: browse.entries.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      kindSlug: entry.kindSlug,
      systemData: systemDataByEntryId.get(entry.id),
    })),
    edges,
    ...(isSpeciesSheet
      ? {
          groupParentKindSlug: "taxon",
          ungroupedSlug:
            kindSlug === "planta" ? "outras-plantas" : "outras-criaturas",
          ungroupedTitle:
            kindSlug === "planta" ? "Outras plantas" : "Outras criaturas",
        }
      : {}),
  });

  return {
    kind: browse.kind,
    browseMode,
    entries: browse.entries,
    total: browse.total,
    tree,
  };
}
