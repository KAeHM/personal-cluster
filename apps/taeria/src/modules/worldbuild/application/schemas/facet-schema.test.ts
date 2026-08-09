import { describe, expect, it } from "vitest";

import {
  buildContentFacetSchema,
  buildEdgesFacetSchema,
  parseContentFacetSchema,
  parseEdgesFacetSchema,
  parseEdgesWikiPlacements,
  slugifyName,
} from "./facet-schema";

describe("facet-schema", () => {
  it("parseContentFacetSchema usa defaults quando schema ausente", () => {
    const fields = parseContentFacetSchema(null, "lore");
    expect(fields[0]?.key).toBe("lore_md");
  });

  it("buildContentFacetSchema gera JSON Schema válido", () => {
    const schema = buildContentFacetSchema([
      {
        key: "lore_md",
        label: "Lore",
        fieldType: "markdown",
        required: true,
        wikiPlacement: "body",
      },
    ]);

    expect(schema?.type).toBe("object");
    expect(schema?.properties).toHaveProperty("lore_md");
  });

  it("parseEdgesFacetSchema lê allowedTypes", () => {
    expect(
      parseEdgesFacetSchema({ allowedTypes: ["crafted_by", "taxonomy"] }),
    ).toEqual(["crafted_by", "taxonomy"]);
  });

  it("parseEdgesWikiPlacements ignora valores inválidos", () => {
    expect(
      parseEdgesWikiPlacements({
        wikiPlacements: { taxonomy: "sidebar", invalid: "nope" },
      }),
    ).toEqual({ taxonomy: "sidebar" });
  });

  it("buildEdgesFacetSchema retorna null sem tipos", () => {
    expect(buildEdgesFacetSchema(["", "  "])).toBeNull();
  });

  it("slugifyName normaliza texto", () => {
    expect(slugifyName("Espada de Valdris")).toBe("espada-de-valdris");
  });

  it("buildContentFacetSchema persiste x-wiki-placement", () => {
    const schema = buildContentFacetSchema([
      {
        key: "lore_md",
        label: "Lore",
        fieldType: "markdown",
        required: true,
        wikiPlacement: "body",
      },
    ]);

    expect(schema?.properties).toMatchObject({
      lore_md: { "x-wiki-placement": "body" },
    });
  });

  it("parseContentFacetSchema lê x-wiki-placement", () => {
    const fields = parseContentFacetSchema(
      {
        type: "object",
        properties: {
          year: {
            type: "number",
            title: "Ano",
            "x-wiki-placement": "hero",
          },
        },
      },
      "lore",
    );

    expect(fields.find((field) => field.key === "year")?.wikiPlacement).toBe(
      "hero",
    );
  });
});
