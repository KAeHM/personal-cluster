import type { CodexEdgeWithTarget, CodexEntry } from "../../domain/codex-entry";
import type { Kind } from "../../domain/kind";
import type { StoredFacetType } from "../../domain/facet-type";
import { STORED_FACET_TYPES } from "../../domain/facet-type";
import {
  parseContentFacetSchema,
  parseEdgesWikiPlacements,
  parseStoredFacetSchema,
  type FacetFieldType,
  type WikiEdgePlacement,
  type WikiFieldPlacement,
} from "../schemas/facet-schema";

export type WikiLayoutField = {
  key: string;
  label: string;
  value: unknown;
  fieldType: FacetFieldType;
  facetType: StoredFacetType;
  wikiPlacement: WikiFieldPlacement;
};

export type WikiLayoutEdgeTarget = {
  slug: string;
  title: string;
  kindSlug: string;
  bannerUrl?: string;
};

export type WikiLayoutEdge = {
  edgeType: string;
  label: string;
  targets: WikiLayoutEdgeTarget[];
  wikiPlacement: WikiEdgePlacement | "related";
};

export type WikiEntryLayout = {
  bannerUrl?: string;
  hero: WikiLayoutField[];
  sidebar: WikiLayoutField[];
  body: WikiLayoutField[];
  sidebarEdges: WikiLayoutEdge[];
  heroEdges: WikiLayoutEdge[];
  related: WikiLayoutEdge[];
};

const EDGE_TYPE_LABELS: Record<string, string> = {
  related_to: "Relacionado",
  written_by: "Escrito por",
  crafted_by: "Forjado por",
  taxonomy: "Taxonomia",
  classified_as: "Classificação",
};

function edgeLabel(edgeType: string): string {
  return EDGE_TYPE_LABELS[edgeType] ?? edgeType.replace(/_/g, " ");
}

function defaultEdgePlacement(edgeType: string): WikiEdgePlacement {
  if (edgeType === "written_by" || edgeType === "crafted_by") {
    return "sidebar";
  }
  return "hidden";
}

function collectFields(entry: CodexEntry, kind: Kind): WikiLayoutField[] {
  const fields: WikiLayoutField[] = [];

  for (const facetType of STORED_FACET_TYPES) {
    const config = kind.facets.find((facet) => facet.facetType === facetType);
    if (!config?.enabled) {
      continue;
    }

    const facetData = entry.facets.find(
      (facet) => facet.facetType === facetType,
    );
    if (!facetData) {
      continue;
    }

    const schemaFields =
      facetType === "visual"
        ? parseStoredFacetSchema(config.schema, "visual")
        : parseContentFacetSchema(config.schema, facetType);

    for (const fieldDef of schemaFields) {
      if (fieldDef.wikiPlacement === "hidden") {
        continue;
      }

      const value = facetData.data[fieldDef.key];
      if (value === undefined || value === null || value === "") {
        continue;
      }

      fields.push({
        key: fieldDef.key,
        label: fieldDef.label,
        value,
        fieldType: fieldDef.fieldType,
        facetType,
        wikiPlacement: fieldDef.wikiPlacement,
      });
    }
  }

  return fields;
}

function extractBannerUrl(entry: CodexEntry): string | undefined {
  const visual = entry.facets.find((facet) => facet.facetType === "visual");
  const url = visual?.data.banner_url;
  return typeof url === "string" && url.trim() !== "" ? url : undefined;
}

function buildEdgeGroups(
  edgesWithTargets: CodexEdgeWithTarget[],
  edgePlacements: Record<string, WikiEdgePlacement>,
  targetMeta: Map<string, { kindSlug: string; bannerUrl?: string }>,
): Pick<WikiEntryLayout, "sidebarEdges" | "heroEdges" | "related"> {
  const grouped = new Map<string, WikiLayoutEdgeTarget[]>();

  for (const edge of edgesWithTargets) {
    if (!edge.toEntry) {
      continue;
    }

    const meta = targetMeta.get(edge.toEntry.id);
    const target: WikiLayoutEdgeTarget = {
      slug: edge.toEntry.slug,
      title: edge.toEntry.title,
      kindSlug: meta?.kindSlug ?? "",
      ...(meta?.bannerUrl ? { bannerUrl: meta.bannerUrl } : {}),
    };

    const existing = grouped.get(edge.edgeType) ?? [];
    existing.push(target);
    grouped.set(edge.edgeType, existing);
  }

  const sidebarEdges: WikiLayoutEdge[] = [];
  const heroEdges: WikiLayoutEdge[] = [];
  const related: WikiLayoutEdge[] = [];

  for (const [edgeType, targets] of grouped) {
    const layoutEdge: WikiLayoutEdge = {
      edgeType,
      label: edgeLabel(edgeType),
      targets,
      wikiPlacement:
        edgeType === "related_to"
          ? "related"
          : (edgePlacements[edgeType] ?? defaultEdgePlacement(edgeType)),
    };

    if (edgeType === "related_to") {
      related.push(layoutEdge);
      continue;
    }

    const placement = layoutEdge.wikiPlacement;
    if (placement === "hero") {
      heroEdges.push(layoutEdge);
    } else if (placement === "sidebar") {
      sidebarEdges.push(layoutEdge);
    }
  }

  return { sidebarEdges, heroEdges, related };
}

export function resolveWikiEntryLayout(input: {
  entry: CodexEntry;
  kind: Kind;
  edgesWithTargets: CodexEdgeWithTarget[];
  targetMeta?: Map<string, { kindSlug: string; bannerUrl?: string }>;
}): WikiEntryLayout {
  const { entry, kind, edgesWithTargets } = input;
  const targetMeta = input.targetMeta ?? new Map();

  const edgesFacet = kind.facets.find((facet) => facet.facetType === "edges");
  const edgePlacements = parseEdgesWikiPlacements(edgesFacet?.schema ?? null);

  const allFields = collectFields(entry, kind);
  const heroKeys = new Set(
    allFields
      .filter((field) => field.wikiPlacement === "hero")
      .map((field) => field.key),
  );

  const hero = allFields.filter((field) => field.wikiPlacement === "hero");
  const body = allFields.filter((field) => field.wikiPlacement === "body");
  const sidebar = allFields.filter(
    (field) => field.wikiPlacement === "sidebar" && !heroKeys.has(field.key),
  );

  const edgeGroups = buildEdgeGroups(
    edgesWithTargets,
    edgePlacements,
    targetMeta,
  );

  return {
    bannerUrl: extractBannerUrl(entry),
    hero,
    sidebar,
    body,
    ...edgeGroups,
  };
}

export function loreExcerpt(entry: CodexEntry, maxLength = 120): string | null {
  const lore = entry.facets.find((facet) => facet.facetType === "lore");
  const markdown = lore?.data.lore_md;
  if (typeof markdown !== "string" || markdown.trim() === "") {
    return null;
  }

  const plain = markdown
    .replace(/[#>*`_~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength).trim()}…`;
}
