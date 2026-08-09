import { describe, expect, it } from "vitest";

import { createEmptyCodexDraft } from "../../domain/codex-draft";
import type { Kind } from "../../domain/kind";
import type { GenerationContext, PlannerOutput } from "./types";
import { resolveEdges } from "./edges-resolver";

function kindWithEdges(
  allowedTypes: string[] | null,
  enabled = true,
): Kind["facets"] {
  return [
    {
      id: "f-edges",
      kindId: "k1",
      facetType: "edges",
      enabled,
      required: false,
      schema: allowedTypes ? { allowedTypes } : null,
      aiPrompt: null,
      displayOrder: 4,
    },
  ];
}

const planner: PlannerOutput = {
  intent: "create",
  kindSlug: "weapon",
  title: "Espada",
  slug: "espada",
  slots: { crafted_by: "ferreiro-valdris" },
  agentsToRun: ["lore"],
  summary: "Criar arma",
};

const context: GenerationContext = {
  kind: {
    id: "k1",
    slug: "weapon",
    name: "Arma",
    description: null,
    aiPrompt: null,
    isBuiltin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    facets: [],
  },
  userIntent: "arma lendária",
  resolvedRefs: [{ slug: "valdris", title: "Valdris", kindSlug: "npc" }],
  styleNotes: [],
  systemRules: [],
  constraints: [],
};

describe("resolveEdges", () => {
  it("adiciona crafted_by e related_to sem duplicar", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.edges = [{ type: "related_to", toSlug: "valdris" }];

    const edges = resolveEdges(planner, context, draft);
    expect(edges).toHaveLength(2);
    expect(edges.some((edge) => edge.type === "crafted_by")).toBe(true);
    expect(edges.some((edge) => edge.toSlug === "valdris")).toBe(true);
  });

  it("adiciona written_by a partir dos slots", () => {
    const plannerWithWriter: PlannerOutput = {
      ...planner,
      slots: { written_by: "cronista" },
    };
    const edges = resolveEdges(
      plannerWithWriter,
      context,
      createEmptyCodexDraft("s1"),
    );
    expect(edges.some((edge) => edge.type === "written_by")).toBe(true);
  });

  it("adiciona taxonomy sugerida quando o kind permite", () => {
    const taxonomyContext: GenerationContext = {
      ...context,
      kind: {
        ...context.kind,
        facets: kindWithEdges(["related_to", "taxonomy"]),
      },
      resolvedRefs: [],
      taxonomyParentSlug: "escola-do-vento",
    };

    const edges = resolveEdges(planner, taxonomyContext, {
      ...createEmptyCodexDraft("s1"),
      slug: "corte-ascendente",
    });

    expect(edges).toContainEqual({
      type: "taxonomy",
      toSlug: "escola-do-vento",
    });
  });

  it("ignora taxonomy quando o tipo não está em allowedTypes", () => {
    const taxonomyContext: GenerationContext = {
      ...context,
      kind: { ...context.kind, facets: kindWithEdges(["related_to"]) },
      resolvedRefs: [],
      taxonomyParentSlug: "escola-do-vento",
    };

    const edges = resolveEdges(
      planner,
      taxonomyContext,
      createEmptyCodexDraft("s1"),
    );

    expect(edges.some((edge) => edge.type === "taxonomy")).toBe(false);
  });

  it("ignora taxonomy quando a facet edges está desligada", () => {
    const taxonomyContext: GenerationContext = {
      ...context,
      kind: {
        ...context.kind,
        facets: kindWithEdges(["related_to", "taxonomy"], false),
      },
      resolvedRefs: [],
      taxonomyParentSlug: "escola-do-vento",
    };

    const edges = resolveEdges(
      planner,
      taxonomyContext,
      createEmptyCodexDraft("s1"),
    );

    expect(edges.some((edge) => edge.type === "taxonomy")).toBe(false);
  });

  it("não aponta taxonomy para a própria entrada nem duplica pai existente", () => {
    const taxonomyContext: GenerationContext = {
      ...context,
      kind: {
        ...context.kind,
        facets: kindWithEdges(["related_to", "taxonomy"]),
      },
      resolvedRefs: [],
      taxonomyParentSlug: "corte-ascendente",
    };

    const selfDraft = {
      ...createEmptyCodexDraft("s1"),
      slug: "corte-ascendente",
    };
    expect(
      resolveEdges(planner, taxonomyContext, selfDraft).some(
        (edge) => edge.type === "taxonomy",
      ),
    ).toBe(false);

    const draftWithParent = createEmptyCodexDraft("s1");
    draftWithParent.edges = [{ type: "taxonomy", toSlug: "outro-pai" }];
    const edges = resolveEdges(
      planner,
      { ...taxonomyContext, taxonomyParentSlug: "escola-do-vento" },
      draftWithParent,
    );

    expect(edges.filter((edge) => edge.type === "taxonomy")).toEqual([
      { type: "taxonomy", toSlug: "outro-pai" },
    ]);
  });

  it("adiciona classified_as quando o kind permite", () => {
    const speciesContext: GenerationContext = {
      ...context,
      kind: {
        ...context.kind,
        slug: "criatura",
        facets: kindWithEdges(["related_to", "taxonomy", "classified_as"]),
      },
      resolvedRefs: [],
      classifiedAsParentSlug: "classe-mamiferos",
    };

    const edges = resolveEdges(
      planner,
      speciesContext,
      createEmptyCodexDraft("s1"),
    );

    expect(edges).toContainEqual({
      type: "classified_as",
      toSlug: "classe-mamiferos",
    });
  });
});
