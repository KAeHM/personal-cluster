import { describe, expect, it, vi } from "vitest";

import type { CodexEntry } from "../../../domain/codex-entry";
import {
  collectCandidateSlugs,
  formatEdgesOnly,
  formatEntryDossier,
  type EntryDossier,
} from "./entry-dossier";

describe("collectCandidateSlugs", () => {
  it("deduplica e prioriza ordem semântica → keyword → slots", () => {
    expect(
      collectCandidateSlugs({
        semanticSlugs: ["Escola-Do-Vento", "corte"],
        keywordSlugs: ["escola-do-vento", "outra"],
        slotValues: ["pai", "corte"],
        limit: 5,
      }),
    ).toEqual(["escola-do-vento", "corte", "outra", "pai"]);
  });

  it("respeita o limite", () => {
    expect(
      collectCandidateSlugs({
        semanticSlugs: ["a", "b", "c"],
        limit: 2,
      }),
    ).toHaveLength(2);
  });
});

describe("formatEntryDossier", () => {
  it("formata lore, system e relações", () => {
    const dossier: EntryDossier = {
      slug: "escola-do-vento",
      title: "Escola do Vento",
      kindSlug: "escola",
      loreExcerpt: "Valoriza leveza.",
      systemSummary: "rank: 1",
      lexiconSummary: null,
      edges: [
        {
          edgeType: "taxonomy",
          toSlug: "arte-da-espada",
          toTitle: "Arte da Espada",
          payload: { rank: 2 },
        },
      ],
    };

    const text = formatEntryDossier(dossier);
    expect(text).toContain("Escola do Vento");
    expect(text).toContain("slug: escola-do-vento");
    expect(text).toContain("Lore: Valoriza leveza.");
    expect(text).toContain("taxonomy → Arte da Espada");
    expect(text).toContain('"rank":2');
  });
});

describe("formatEdgesOnly", () => {
  it("lista edges ou nenhuma", () => {
    expect(formatEdgesOnly("x", "X", [])).toContain("nenhuma");
    expect(
      formatEdgesOnly("x", "X", [
        {
          edgeType: "related_to",
          toSlug: "y",
          toTitle: "Y",
          payload: null,
        },
      ]),
    ).toContain("related_to → Y (y)");
  });
});

describe("buildEntryDossier (loader)", () => {
  it("monta dossiê a partir do repositório", async () => {
    const entry: CodexEntry = {
      id: "e1",
      kindId: "k1",
      slug: "escola-do-vento",
      title: "Escola do Vento",
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
      facets: [
        {
          id: "f1",
          entryId: "e1",
          facetType: "lore",
          data: { lore_md: "Texto longo de lore." },
        },
      ],
      edges: [
        {
          id: "edge1",
          fromEntryId: "e1",
          toEntryId: "e2",
          edgeType: "taxonomy",
          payload: null,
          createdAt: new Date(),
        },
      ],
    };

    const codexRepo = {
      findBySlug: vi.fn().mockResolvedValue(entry),
      findById: vi.fn().mockResolvedValue({
        id: "e2",
        slug: "arte-da-espada",
        title: "Arte da Espada",
      }),
    };
    const kindRepo = {
      findById: vi.fn().mockResolvedValue({ slug: "escola" }),
    };

    const { buildEntryDossier } = await import("./entry-dossier");
    const dossier = await buildEntryDossier(
      codexRepo as never,
      kindRepo as never,
      "escola-do-vento",
    );

    expect(dossier?.kindSlug).toBe("escola");
    expect(dossier?.loreExcerpt).toContain("Texto longo");
    expect(dossier?.edges[0]?.toSlug).toBe("arte-da-espada");
  });
});
