import { describe, expect, it } from "vitest";

import { buildEntryChunks, ENTRY_CHUNK_MAX_CHARS } from "./entry-chunks";

describe("buildEntryChunks", () => {
  it("gera chunk único com título quando não há facetas com conteúdo", () => {
    const chunks = buildEntryChunks({ title: "Espada de Valdris", facets: [] });
    expect(chunks).toEqual(["Espada de Valdris"]);
  });

  it("retorna vazio sem título nem conteúdo", () => {
    const chunks = buildEntryChunks({ title: "  ", facets: [] });
    expect(chunks).toEqual([]);
  });

  it("prefixa lore com o título", () => {
    const chunks = buildEntryChunks({
      title: "Espada",
      facets: [{ facetType: "lore", data: { lore_md: "Uma lâmina antiga." } }],
    });

    expect(chunks).toEqual(["# Espada\n\nUma lâmina antiga."]);
  });

  it("quebra lore longo em blocos de até ~1200 chars por parágrafo", () => {
    const paragraph = "a".repeat(700);
    const loreMd = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;

    const chunks = buildEntryChunks({
      title: "Crônica",
      facets: [{ facetType: "lore", data: { lore_md: loreMd } }],
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(
        ENTRY_CHUNK_MAX_CHARS + "# Crônica\n\n".length,
      );
      expect(chunk.startsWith("# Crônica")).toBe(true);
    }
  });

  it("divide parágrafo maior que o limite em blocos duros", () => {
    const huge = "b".repeat(ENTRY_CHUNK_MAX_CHARS * 2 + 100);

    const chunks = buildEntryChunks({
      title: "Tomo",
      facets: [{ facetType: "lore", data: { lore_md: huge } }],
    });

    expect(chunks).toHaveLength(3);
  });

  it("serializa system e lexicon como chunks próprios", () => {
    const chunks = buildEntryChunks({
      title: "Corte Ascendente",
      facets: [
        { facetType: "lore", data: { lore_md: "Técnica da escola do vento." } },
        {
          facetType: "system",
          data: { nivel: 2, custo_pvel: 3, detalhes: { ignorado: true } },
        },
        { facetType: "lexicon", data: { term: "Aeth", translation: "vento" } },
      ],
    });

    expect(chunks).toHaveLength(3);
    expect(chunks[1]).toBe(
      "# Corte Ascendente — sistema\n\nnivel: 2\ncusto_pvel: 3",
    );
    expect(chunks[2]).toBe(
      "# Corte Ascendente — léxico\n\nterm: Aeth\ntranslation: vento",
    );
  });

  it("ignora facetas system/lexicon sem valores primitivos", () => {
    const chunks = buildEntryChunks({
      title: "Vazio",
      facets: [
        { facetType: "system", data: { nested: { a: 1 } } },
        { facetType: "lexicon", data: {} },
      ],
    });

    expect(chunks).toEqual(["Vazio"]);
  });
});
