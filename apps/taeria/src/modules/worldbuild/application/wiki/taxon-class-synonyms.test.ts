import { describe, expect, it } from "vitest";

import {
  resolveTaxonClassSlugFromText,
  TAXON_CLASS_SYNONYMS,
} from "./taxon-class-synonyms";

describe("resolveTaxonClassSlugFromText", () => {
  it("resolve sinônimos comuns para slugs de Classe", () => {
    expect(resolveTaxonClassSlugFromText("um mamífero predador")).toBe(
      "classe-mamiferos",
    );
    expect(resolveTaxonClassSlugFromText("Ave de rapina")).toBe("classe-aves");
    expect(resolveTaxonClassSlugFromText("réptil aquático")).toBe(
      "classe-repteis",
    );
    expect(resolveTaxonClassSlugFromText("inseto gigante")).toBe(
      "classe-artropodes",
    );
    expect(resolveTaxonClassSlugFromText("árvore sagrada")).toBe(
      "classe-arvores",
    );
  });

  it("retorna null quando não há sinônimo", () => {
    expect(resolveTaxonClassSlugFromText("criatura misteriosa")).toBeNull();
    expect(resolveTaxonClassSlugFromText("")).toBeNull();
  });

  it("expõe mapa estável de sinônimos", () => {
    expect(TAXON_CLASS_SYNONYMS.mamifero).toBe("classe-mamiferos");
    expect(TAXON_CLASS_SYNONYMS.ave).toBe("classe-aves");
  });
});
