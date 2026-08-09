import { describe, expect, it } from "vitest";
import { FACET_TYPES } from "../../domain/facet-type";
import { createKindSchema, updateKindSchema } from "./kind.schema";

function defaultFacetsInput(
  overrides: Partial<
    Record<
      (typeof FACET_TYPES)[number],
      { enabled?: boolean; required?: boolean; schema?: string }
    >
  > = {},
) {
  return FACET_TYPES.map((facetType) => {
    const override = overrides[facetType];
    return {
      facetType,
      enabled: override?.enabled ?? facetType === "lore",
      required: override?.required ?? false,
      schema: override?.schema ?? "",
    };
  });
}

const validBase = {
  slug: "weapon",
  name: "Arma",
  description: "",
  aiPrompt: "",
  facets: defaultFacetsInput(),
};

describe("createKindSchema", () => {
  it("aceita input completo e válido", () => {
    const result = createKindSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe("weapon");
      expect(result.data.facets).toHaveLength(6);
    }
  });

  it("rejeita slug inválido", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      slug: "Weapon",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quando nenhuma faceta de conteúdo está habilitada", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      facets: defaultFacetsInput({
        lore: { enabled: false },
        system: { enabled: false },
        lexicon: { enabled: false },
      }),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita required sem enabled", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      facets: defaultFacetsInput({
        lore: { enabled: false, required: true },
      }),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita edges/embeddings/visual como obrigatórios", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      facets: defaultFacetsInput({
        edges: { enabled: true, required: true },
      }),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita schema JSON inválido", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      facets: defaultFacetsInput({
        lore: { schema: "{ invalid" },
      }),
    });
    expect(result.success).toBe(false);
  });

  it("aceita schema JSON válido", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      facets: defaultFacetsInput({
        lore: { schema: '{"type":"object"}' },
      }),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const lore = result.data.facets.find((f) => f.facetType === "lore");
      expect(lore?.schema).toEqual({ type: "object" });
    }
  });

  it("rejeita facets com tamanho diferente de 6", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      facets: defaultFacetsInput().slice(0, 3),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita facet types duplicados", () => {
    const facets = defaultFacetsInput();
    facets[1] = { ...facets[0] };
    const result = createKindSchema.safeParse({
      ...validBase,
      facets,
    });
    expect(result.success).toBe(false);
  });

  it("aceita schema já como objeto", () => {
    const facets = defaultFacetsInput().map((facet) =>
      facet.facetType === "lore"
        ? { ...facet, schema: { type: "object" } }
        : facet,
    );
    const result = createKindSchema.safeParse({
      ...validBase,
      facets,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita schema que não é string nem objeto", () => {
    const facets = defaultFacetsInput().map((facet) =>
      facet.facetType === "lore" ? { ...facet, schema: 42 } : facet,
    );
    const result = createKindSchema.safeParse({
      ...validBase,
      facets,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita schema JSON que é array", () => {
    const result = createKindSchema.safeParse({
      ...validBase,
      facets: defaultFacetsInput({
        lore: { schema: "[]" },
      }),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateKindSchema", () => {
  it("aceita o mesmo formato de create", () => {
    expect(updateKindSchema.safeParse(validBase).success).toBe(true);
  });
});
