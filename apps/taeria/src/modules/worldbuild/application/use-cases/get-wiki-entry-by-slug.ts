import type { CodexEdgeWithTarget, CodexEntry } from "../../domain/codex-entry";
import type { Kind } from "../../domain/kind";
import type { WikiTaxonomyEdgeTarget } from "../../domain/wiki-codex.repository";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import { getWikiCodexRepository } from "../../infrastructure/wiki-codex.repository.factory";
import {
  resolveWikiEntryLayout,
  type WikiEntryLayout,
} from "../wiki/resolve-wiki-entry-layout";
import {
  getWikiBrowseMode,
  getWikiEntryLayoutMode,
} from "../wiki/wiki-kind-config";

export type WikiEntryTaxonomyContext = {
  ancestors: WikiTaxonomyEdgeTarget[];
  children: WikiTaxonomyEdgeTarget[];
};

export type WikiEntryDetail = {
  entry: CodexEntry;
  kind: Kind;
  layout: WikiEntryLayout;
  layoutMode: ReturnType<typeof getWikiEntryLayoutMode>;
  taxonomy: WikiEntryTaxonomyContext;
};

function extractBannerUrl(entry: CodexEntry): string | undefined {
  const visual = entry.facets.find((facet) => facet.facetType === "visual");
  const url = visual?.data.banner_url;
  return typeof url === "string" && url.trim() !== "" ? url : undefined;
}

async function buildTaxonomyAncestors(
  entry: CodexEntry,
  kindSlug: string,
  wikiRepo: Awaited<ReturnType<typeof getWikiCodexRepository>>,
  kindRepo: Awaited<ReturnType<typeof getKindRepository>>,
): Promise<WikiTaxonomyEdgeTarget[]> {
  const ancestors: WikiTaxonomyEdgeTarget[] = [];
  const visited = new Set<string>([entry.id]);
  let current = entry;
  const isSpeciesSheet = kindSlug === "criatura" || kindSlug === "planta";
  let preferClassifiedAs = isSpeciesSheet;

  for (let depth = 0; depth < 8; depth += 1) {
    const parentEdge = preferClassifiedAs
      ? (current.edges.find((edge) => edge.edgeType === "classified_as") ??
        current.edges.find((edge) => edge.edgeType === "taxonomy"))
      : current.edges.find((edge) => edge.edgeType === "taxonomy");
    preferClassifiedAs = false;

    if (!parentEdge) {
      break;
    }

    const parents = await wikiRepo.findByIds([parentEdge.toEntryId]);
    const parent = parents[0];
    if (!parent || visited.has(parent.id)) {
      break;
    }

    const parentKind = await kindRepo.findById(parent.kindId);
    ancestors.unshift({
      id: parent.id,
      slug: parent.slug,
      title: parent.title,
      kindSlug: parentKind?.slug ?? "",
    });

    visited.add(parent.id);
    current = parent;
  }

  return ancestors;
}

async function loadTaxonomyContext(
  entry: CodexEntry,
  kind: Kind,
  wikiRepo: Awaited<ReturnType<typeof getWikiCodexRepository>>,
  kindRepo: Awaited<ReturnType<typeof getKindRepository>>,
): Promise<WikiEntryTaxonomyContext> {
  const browseMode = getWikiBrowseMode(kind.slug);
  const layoutMode = getWikiEntryLayoutMode(kind.slug);
  const needsTaxonomy =
    layoutMode === "technique" ||
    browseMode === "tree" ||
    browseMode === "treeGrouped";

  if (!needsTaxonomy) {
    return { ancestors: [], children: [] };
  }

  const [ancestors, children] = await Promise.all([
    buildTaxonomyAncestors(entry, kind.slug, wikiRepo, kindRepo),
    layoutMode === "technique"
      ? wikiRepo.listTaxonomyChildren(entry.id)
      : Promise.resolve([]),
  ]);

  return { ancestors, children };
}

export async function getWikiEntryBySlug(
  slug: string,
): Promise<WikiEntryDetail | null> {
  const wikiRepo = await getWikiCodexRepository();
  const entry = await wikiRepo.findBySlug(slug);
  if (!entry) {
    return null;
  }

  const kindRepo = await getKindRepository();
  const kind = await kindRepo.findById(entry.kindId);
  if (!kind) {
    return null;
  }

  const targetIds = [...new Set(entry.edges.map((edge) => edge.toEntryId))];
  const visibleTargets = await wikiRepo.findByIds(targetIds);
  const targetById = new Map(
    visibleTargets.map((target) => [target.id, target]),
  );

  const kindIds = [...new Set(visibleTargets.map((target) => target.kindId))];
  const kinds = await Promise.all(
    kindIds.map((kindId) => kindRepo.findById(kindId)),
  );
  const kindSlugById = new Map(
    kinds
      .filter((item): item is Kind => item !== null)
      .map((item) => [item.id, item.slug]),
  );

  const targetMeta = new Map<
    string,
    { kindSlug: string; bannerUrl?: string }
  >();
  for (const target of visibleTargets) {
    targetMeta.set(target.id, {
      kindSlug: kindSlugById.get(target.kindId) ?? "",
      bannerUrl: extractBannerUrl(target),
    });
  }

  const edgesWithTargets: CodexEdgeWithTarget[] = entry.edges.map((edge) => {
    const target = targetById.get(edge.toEntryId);
    return {
      ...edge,
      toEntry: target
        ? { id: target.id, slug: target.slug, title: target.title }
        : null,
    };
  });

  const layout = resolveWikiEntryLayout({
    entry,
    kind,
    edgesWithTargets,
    targetMeta,
  });

  const taxonomy = await loadTaxonomyContext(entry, kind, wikiRepo, kindRepo);

  return {
    entry,
    kind,
    layout,
    layoutMode: getWikiEntryLayoutMode(kind.slug),
    taxonomy,
  };
}

export async function listWikiEntries(params: {
  query?: string;
  kindSlug?: string;
  limit?: number;
  offset?: number;
}) {
  const wikiRepo = await getWikiCodexRepository();
  return wikiRepo.list(params);
}

export async function listWikiKindSlugs(): Promise<string[]> {
  const wikiRepo = await getWikiCodexRepository();
  return wikiRepo.listVisibleKindSlugs();
}
