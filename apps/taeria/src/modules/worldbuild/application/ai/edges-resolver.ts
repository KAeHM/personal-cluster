import type { CodexDraft } from "../../domain/codex-draft";
import { parseEdgesFacetSchema } from "../schemas/facet-schema";
import type { GenerationContext, PlannerOutput } from "./types";

function allowedEdgeTypes(context: GenerationContext): string[] {
  const edgesFacet = context.kind.facets.find(
    (facet) => facet.facetType === "edges" && facet.enabled,
  );
  if (!edgesFacet) {
    return [];
  }
  return parseEdgesFacetSchema(edgesFacet.schema ?? null);
}

export function resolveEdges(
  planner: PlannerOutput,
  context: GenerationContext,
  draft: CodexDraft,
): CodexDraft["edges"] {
  const edges: CodexDraft["edges"] = [...draft.edges];
  const allowed = allowedEdgeTypes(context);

  const craftedBy = planner.slots.craftedBy ?? planner.slots.crafted_by;
  if (craftedBy) {
    edges.push({ type: "crafted_by", toSlug: craftedBy });
  }

  const writtenBy = planner.slots.writtenBy ?? planner.slots.written_by;
  if (writtenBy) {
    edges.push({ type: "written_by", toSlug: writtenBy });
  }

  for (const ref of context.resolvedRefs) {
    if (!edges.some((edge) => edge.toSlug === ref.slug)) {
      edges.push({ type: "related_to", toSlug: ref.slug });
    }
  }

  const classifiedAsParent = context.classifiedAsParentSlug;
  if (
    classifiedAsParent &&
    classifiedAsParent !== draft.slug &&
    allowed.includes("classified_as") &&
    !edges.some((edge) => edge.type === "classified_as")
  ) {
    edges.push({ type: "classified_as", toSlug: classifiedAsParent });
  }

  const taxonomyParent = context.taxonomyParentSlug;
  if (
    taxonomyParent &&
    taxonomyParent !== draft.slug &&
    allowed.includes("taxonomy") &&
    !edges.some((edge) => edge.type === "taxonomy")
  ) {
    edges.push({ type: "taxonomy", toSlug: taxonomyParent });
  }

  const unique = new Map<string, CodexDraft["edges"][number]>();
  for (const edge of edges) {
    if (!edge.toSlug.trim()) {
      continue;
    }
    unique.set(`${edge.type}:${edge.toSlug}`, edge);
  }

  return Array.from(unique.values());
}
