import { describe, expect, it } from "vitest";

import type { CodexEntry } from "../../domain/codex-entry";
import type { Kind } from "../../domain/kind";
import {
  loreExcerpt,
  resolveWikiEntryLayout,
} from "./resolve-wiki-entry-layout";

const baseKind: Kind = {
  id: "kind-1",
  slug: "artifact",
  name: "Artefato",
  description: null,
  aiPrompt: null,
  isBuiltin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  facets: [
    {
      id: "f1",
      kindId: "kind-1",
      facetType: "lore",
      enabled: true,
      required: true,
      aiPrompt: null,
      displayOrder: 0,
      schema: {
        type: "object",
        properties: {
          lore_md: {
            type: "string",
            format: "markdown",
            title: "Lore",
            "x-wiki-placement": "body",
          },
          year: {
            type: "number",
            title: "Ano",
            "x-wiki-placement": "hero",
          },
        },
      },
    },
    {
      id: "f2",
      kindId: "kind-1",
      facetType: "visual",
      enabled: true,
      required: false,
      aiPrompt: null,
      displayOrder: 1,
      schema: {
        type: "object",
        properties: {
          banner_url: {
            type: "string",
            format: "image",
            title: "Banner",
            "x-wiki-placement": "hidden",
          },
        },
      },
    },
    {
      id: "f3",
      kindId: "kind-1",
      facetType: "edges",
      enabled: true,
      required: false,
      aiPrompt: null,
      displayOrder: 2,
      schema: {
        allowedTypes: ["related_to", "written_by"],
        wikiPlacements: { written_by: "sidebar" },
      },
    },
  ],
};

const baseEntry: CodexEntry = {
  id: "entry-1",
  kindId: "kind-1",
  slug: "espada",
  title: "Espada",
  visibility: "public",
  createdAt: new Date(),
  updatedAt: new Date(),
  facets: [
    {
      id: "f1",
      entryId: "entry-1",
      facetType: "lore",
      data: { lore_md: "# História\n\nTexto.", year: 1200 },
    },
    {
      id: "f2",
      entryId: "entry-1",
      facetType: "visual",
      data: { banner_url: "https://example.com/banner.jpg" },
    },
  ],
  edges: [
    {
      id: "e1",
      fromEntryId: "entry-1",
      toEntryId: "entry-2",
      edgeType: "related_to",
      payload: null,
      createdAt: new Date(),
    },
    {
      id: "e2",
      fromEntryId: "entry-1",
      toEntryId: "entry-3",
      edgeType: "written_by",
      payload: null,
      createdAt: new Date(),
    },
  ],
};

describe("resolveWikiEntryLayout", () => {
  it("agrupa campos por wikiPlacement e extrai banner", () => {
    const layout = resolveWikiEntryLayout({
      entry: baseEntry,
      kind: baseKind,
      edgesWithTargets: baseEntry.edges.map((edge) => ({
        ...edge,
        toEntry:
          edge.toEntryId === "entry-2"
            ? { id: "entry-2", slug: "autor", title: "Autor" }
            : { id: "entry-3", slug: "escriba", title: "Escriba" },
      })),
    });

    expect(layout.bannerUrl).toBe("https://example.com/banner.jpg");
    expect(layout.hero.map((field) => field.key)).toEqual(["year"]);
    expect(layout.body.map((field) => field.key)).toEqual(["lore_md"]);
    expect(layout.related).toHaveLength(1);
    expect(layout.related[0]?.edgeType).toBe("related_to");
    expect(layout.sidebarEdges[0]?.edgeType).toBe("written_by");
  });

  it("loreExcerpt remove markdown e trunca", () => {
    expect(loreExcerpt(baseEntry, 20)).toBe("História Texto.");
  });

  it("omite campos vazios e edges sem target visível", () => {
    const layout = resolveWikiEntryLayout({
      entry: {
        ...baseEntry,
        facets: [
          {
            id: "f1",
            entryId: "entry-1",
            facetType: "lore",
            data: { lore_md: "Texto.", year: null },
          },
        ],
      },
      kind: baseKind,
      edgesWithTargets: baseEntry.edges.map((edge) => ({
        ...edge,
        toEntry: null,
      })),
    });

    expect(layout.hero).toHaveLength(0);
    expect(layout.related).toHaveLength(0);
    expect(layout.body).toHaveLength(1);
  });

  it("coloca crafted_by e written_by no sidebar por default", () => {
    const layout = resolveWikiEntryLayout({
      entry: baseEntry,
      kind: baseKind,
      edgesWithTargets: [
        {
          id: "e3",
          fromEntryId: "entry-1",
          toEntryId: "entry-4",
          edgeType: "crafted_by",
          payload: null,
          createdAt: new Date(),
          toEntry: { id: "entry-4", slug: "ferreiro", title: "Ferreiro" },
        },
        {
          id: "e4",
          fromEntryId: "entry-1",
          toEntryId: "entry-5",
          edgeType: "written_by",
          payload: null,
          createdAt: new Date(),
          toEntry: { id: "entry-5", slug: "autor", title: "Autor" },
        },
      ],
    });

    expect(layout.sidebarEdges.map((edge) => edge.edgeType).sort()).toEqual([
      "crafted_by",
      "written_by",
    ]);
  });

  it("loreExcerpt retorna null sem lore", () => {
    expect(
      loreExcerpt({
        ...baseEntry,
        facets: [],
      }),
    ).toBeNull();
  });

  it("loreExcerpt trunca textos longos", () => {
    expect(
      loreExcerpt(
        {
          ...baseEntry,
          facets: [
            {
              id: "f1",
              entryId: "entry-1",
              facetType: "lore",
              data: {
                lore_md: "# Título\n\n" + "palavra ".repeat(40),
              },
            },
          ],
        },
        20,
      ),
    ).toMatch(/…$/);
  });

  it("coloca edges hero quando configurado", () => {
    const layout = resolveWikiEntryLayout({
      entry: baseEntry,
      kind: {
        ...baseKind,
        facets: baseKind.facets.map((facet) =>
          facet.facetType === "edges"
            ? {
                ...facet,
                schema: {
                  allowedTypes: ["taxonomy"],
                  wikiPlacements: { taxonomy: "hero" },
                },
              }
            : facet,
        ),
      },
      edgesWithTargets: [
        {
          id: "e5",
          fromEntryId: "entry-1",
          toEntryId: "entry-5",
          edgeType: "taxonomy",
          payload: null,
          createdAt: new Date(),
          toEntry: { id: "entry-5", slug: "fauna", title: "Fauna" },
        },
      ],
    });

    expect(layout.heroEdges[0]?.edgeType).toBe("taxonomy");
  });
});
