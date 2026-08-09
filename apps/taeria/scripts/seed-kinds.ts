import type { SupabaseClient } from "@supabase/supabase-js";

export type SeedKindFacet = {
  facetType: string;
  enabled: boolean;
  required: boolean;
  displayOrder: number;
  schema: Record<string, unknown> | null;
};

export type SeedKind = {
  slug: string;
  name: string;
  description: string;
  /** Instruções permanentes para o Studio AI. */
  aiPrompt?: string | null;
  facets: SeedKindFacet[];
};

const LORE_SCHEMA = {
  type: "object",
  properties: {
    lore_md: {
      type: "string",
      format: "markdown",
      title: "Texto narrativo",
      "x-wiki-placement": "body",
    },
  },
  required: ["lore_md"],
};

const VISUAL_SCHEMA = {
  type: "object",
  properties: {
    banner_url: {
      type: "string",
      format: "image",
      title: "Banner",
      "x-wiki-placement": "hidden",
    },
  },
};

function systemSchema(
  properties: Record<string, Record<string, unknown>>,
  required: string[] = [],
): Record<string, unknown> {
  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function field(
  title: string,
  type: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return { type, title, ...extra };
}

const NPC_STATS_SCHEMA = systemSchema({
  nivel: field("Nível", "integer", { "x-wiki-placement": "sidebar" }),
  reflexo: field("Reflexo", "integer", { "x-wiki-placement": "sidebar" }),
  constituicao: field("Constituição", "integer", {
    "x-wiki-placement": "sidebar",
  }),
  mente: field("Mente", "integer", { "x-wiki-placement": "sidebar" }),
});

const RACA_SYSTEM_SCHEMA = systemSchema({
  taxa_movimento_pvel_por_metro: field("PVel por metro", "number", {
    "x-wiki-placement": "sidebar",
  }),
  reflexo_inicial: field("Reflexo inicial", "integer", {
    "x-wiki-placement": "sidebar",
  }),
  constituicao_inicial: field("Constituição inicial", "integer", {
    "x-wiki-placement": "sidebar",
  }),
  mente_inicial: field("Mente inicial", "integer", {
    "x-wiki-placement": "sidebar",
  }),
});

const ESCOLA_SYSTEM_SCHEMA = systemSchema({
  ordem: field("Ordem na árvore", "integer", {
    "x-wiki-placement": "sidebar",
  }),
  resumo: field("Resumo", "string", { "x-wiki-placement": "sidebar" }),
});

const HABILIDADE_SYSTEM_SCHEMA = systemSchema({
  intencao: field("Intenção", "string", {
    "x-wiki-placement": "sidebar",
  }),
  alvo: field("Tipo de alvo", "string", { "x-wiki-placement": "sidebar" }),
  nivel: field("Nível da habilidade", "integer", {
    "x-wiki-placement": "sidebar",
  }),
  custo_pvel: field("Custo PVel", "integer", {
    "x-wiki-placement": "hidden",
  }),
  custo_estamina: field("Custo Estamina", "integer", {
    "x-wiki-placement": "hidden",
  }),
  custo_mana: field("Custo Mana", "integer", {
    "x-wiki-placement": "hidden",
  }),
  efeito_status: field("Status aplicado (slug)", "string", {
    "x-wiki-placement": "hidden",
  }),
});

const EQUIPAMENTO_SYSTEM_SCHEMA = systemSchema({
  peso_kg: field("Peso (kg)", "number", { "x-wiki-placement": "sidebar" }),
  dano_base: field("Dano base", "integer", {
    "x-wiki-placement": "sidebar",
  }),
  capacidade_max_estamina: field("Capacidade máx. Estamina", "integer", {
    "x-wiki-placement": "sidebar",
  }),
  slot: field("Slot", "string", { "x-wiki-placement": "sidebar" }),
});

const RECEITA_SYSTEM_SCHEMA = systemSchema({
  habilidade_minima: field("Habilidade mínima (slug)", "string", {
    "x-wiki-placement": "sidebar",
  }),
  insumos: field("Insumos", "string", { "x-wiki-placement": "sidebar" }),
  saida: field("Saída", "string", { "x-wiki-placement": "sidebar" }),
});

const RECURSO_SYSTEM_SCHEMA = systemSchema({
  peso_kg: field("Peso (kg)", "number", { "x-wiki-placement": "sidebar" }),
  raridade: field("Raridade", "string", { "x-wiki-placement": "sidebar" }),
});

const DIVINDADE_SYSTEM_SCHEMA = systemSchema({
  dominios: field("Domínios", "string", { "x-wiki-placement": "sidebar" }),
});

const ORGANIZACAO_SYSTEM_SCHEMA = systemSchema({
  tipo: field("Tipo", "string", { "x-wiki-placement": "sidebar" }),
});

const TERMO_LEXICON_SCHEMA = {
  type: "object",
  properties: {
    term: {
      type: "string",
      title: "Termo",
      "x-wiki-placement": "hero",
    },
    translation: {
      type: "string",
      title: "Tradução",
      "x-wiki-placement": "hero",
    },
    pronuncia: {
      type: "string",
      title: "Pronúncia",
      "x-wiki-placement": "sidebar",
    },
  },
  required: ["term"],
};

function edgesRelatedOnly(): Record<string, unknown> {
  return { allowedTypes: ["related_to"], wikiPlacements: {} };
}

function edgesWithTaxonomy(): Record<string, unknown> {
  return {
    allowedTypes: ["related_to", "taxonomy"],
    wikiPlacements: { taxonomy: "sidebar" },
  };
}

/** Espécie (criatura/planta): classifica-se em um taxon; taxonomy same-kind opcional. */
function edgesSpeciesSheet(): Record<string, unknown> {
  return {
    allowedTypes: ["related_to", "taxonomy", "classified_as"],
    wikiPlacements: {
      taxonomy: "sidebar",
      classified_as: "sidebar",
    },
  };
}

function edgesTaxonCatalog(): Record<string, unknown> {
  return {
    allowedTypes: ["taxonomy"],
    wikiPlacements: { taxonomy: "sidebar" },
  };
}

const TAXON_SYSTEM_SCHEMA = systemSchema({
  nivel: field("Nível taxonômico", "string", {
    "x-wiki-placement": "sidebar",
  }),
  codigo: field("Código (tratado)", "string", {
    "x-wiki-placement": "sidebar",
  }),
  nome_ancestral: field("Nome ancestral", "string", {
    "x-wiki-placement": "sidebar",
  }),
  ordem: field("Ordem na árvore", "integer", {
    "x-wiki-placement": "sidebar",
  }),
});

const CRIATURA_AI_PROMPT = `Você cria fichas de CRIATURA em Taeria. Toda criatura é sempre uma Espécie (folha da taxonomia).

Regras de taxonomia (tratado Da Ordem dos Seres em Taeria):
- NÃO crie Selos, Reinos, Filo nem entries de kind "termo" para níveis taxonômicos.
- NÃO use kind "taxon" para a ficha — a ficha é kind criatura.
- Classifique com edge classified_as apontando para um taxon pai (em geral uma Classe, ex. classe-mamiferos).
- O caminho completo (Classe → Reino → Selo) é derivado do catálogo taxon; o mestre/agente só escolhe o pai imediato.
- Sinônimos úteis: mamífero→classe-mamiferos, ave→classe-aves, réptil→classe-repteis, peixe→classe-peixes, inseto/artrópode→classe-artropodes.
- O livro "Da Ordem dos Seres em Taeria" é referência canônica (related_to), não um nó da árvore.
- Foque lore + ficha de combate; mencione no lore o que a espécie é (ex. mamífero predador) para deduzir a Classe.`;

const PLANTA_AI_PROMPT = `Você cria fichas de PLANTA em Taeria. Toda planta é sempre uma Espécie (folha da taxonomia).

Regras de taxonomia (tratado Da Ordem dos Seres em Taeria):
- Plantas pertencem ao Reino NETSARIM sob o Selo ḤAYIM.
- NÃO crie Selos/Reinos/termos Linneanos; use edge classified_as para um taxon (Classe sob NETSARIM, ex. classe-arvores, classe-ervas).
- A ficha é kind planta; o catálogo acima da espécie é kind taxon.
- O livro "Da Ordem dos Seres em Taeria" é referência (related_to), não nó da árvore.
- Foque lore e usos; diga o tipo próximo (árvore, erva, vinha…) para classificar.`;

const TAXON_AI_PROMPT = `Você cria nós do catálogo TAXON (Classificação / Ordem dos Seres) — acima da Espécie.

- Níveis: selo | reino | filo | classe | ordem | familia | genero (campo system.nivel).
- Hierarquia com edge taxonomy (filho → pai). Espécies de jogo (criatura/planta) NÃO são taxon.
- Respeite os Selos ḤAYIM, YETSARIM, RUAKHIM e os Reinos do tratado; não invente Selos novos.
- Codigo em system.codigo (ex. HAYIM, HAYOTH, NETSARIM).`;

function edgesCrafting(): Record<string, unknown> {
  return {
    allowedTypes: ["related_to", "crafted_by"],
    wikiPlacements: { crafted_by: "sidebar" },
  };
}

function edgesRaca(): Record<string, unknown> {
  return {
    allowedTypes: ["related_to", "taxonomy"],
    wikiPlacements: { taxonomy: "sidebar" },
  };
}

function disabledFacet(facetType: string, displayOrder: number): SeedKindFacet {
  return {
    facetType,
    enabled: false,
    required: false,
    displayOrder,
    schema: null,
  };
}

function buildKindFacets(
  config: Partial<
    Record<
      string,
      Pick<SeedKindFacet, "enabled" | "required" | "schema"> & {
        displayOrder?: number;
      }
    >
  >,
): SeedKindFacet[] {
  const order: Array<{ type: string; defaultOrder: number }> = [
    { type: "lore", defaultOrder: 0 },
    { type: "system", defaultOrder: 1 },
    { type: "lexicon", defaultOrder: 2 },
    { type: "visual", defaultOrder: 3 },
    { type: "edges", defaultOrder: 4 },
    { type: "embeddings", defaultOrder: 5 },
  ];

  return order.map(({ type, defaultOrder }) => {
    const item = config[type];
    if (item) {
      return {
        facetType: type,
        enabled: item.enabled,
        required: item.required,
        displayOrder: item.displayOrder ?? defaultOrder,
        schema: item.schema ?? null,
      };
    }
    // RAG do Studio: embeddings ligados por padrão em todos os kinds do seed.
    if (type === "embeddings") {
      return {
        facetType: type,
        enabled: true,
        required: false,
        displayOrder: defaultOrder,
        schema: null,
      };
    }
    return disabledFacet(type, defaultOrder);
  });
}

export const TAERIA_KINDS: SeedKind[] = [
  {
    slug: "lenda",
    name: "Lenda",
    description: "Mitos, origens e histórias do worldbuild.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      visual: { enabled: true, required: false, schema: VISUAL_SCHEMA },
      edges: { enabled: true, required: false, schema: edgesRelatedOnly() },
    }),
  },
  {
    slug: "personagem",
    name: "Personagem",
    description: "NPCs e figuras do worldbuild.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: NPC_STATS_SCHEMA,
      },
      edges: { enabled: true, required: false, schema: edgesRelatedOnly() },
    }),
  },
  {
    slug: "lugar",
    name: "Lugar",
    description: "Territórios, cidades e regiões de Taeria.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      visual: { enabled: true, required: false, schema: VISUAL_SCHEMA },
      edges: {
        enabled: true,
        required: false,
        schema: edgesWithTaxonomy(),
      },
    }),
  },
  {
    slug: "livro",
    name: "Livro",
    description: "Documentos, crônicas e textos in-world.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      edges: { enabled: true, required: false, schema: edgesRelatedOnly() },
    }),
  },
  {
    slug: "raca",
    name: "Raça",
    description: "Pacotes base de criação — movimento e atributos iniciais.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: RACA_SYSTEM_SCHEMA,
      },
      edges: { enabled: true, required: false, schema: edgesRaca() },
    }),
  },
  {
    slug: "escola",
    name: "Escola / postura",
    description: "Agrupa árvores de habilidades (ex.: Postura da Neblina).",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: ESCOLA_SYSTEM_SCHEMA,
      },
      edges: {
        enabled: true,
        required: false,
        schema: edgesWithTaxonomy(),
      },
    }),
  },
  {
    slug: "habilidade",
    name: "Habilidade",
    description: "Técnicas, magias e capacidades do sistema Taeria.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: HABILIDADE_SYSTEM_SCHEMA,
      },
      edges: {
        enabled: true,
        required: false,
        schema: edgesWithTaxonomy(),
      },
    }),
  },
  {
    slug: "equipamento",
    name: "Equipamento",
    description: "Armas, armaduras e itens com peso e limites mecânicos.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: EQUIPAMENTO_SYSTEM_SCHEMA,
      },
      visual: { enabled: true, required: false, schema: VISUAL_SCHEMA },
      edges: { enabled: true, required: false, schema: edgesCrafting() },
    }),
  },
  {
    slug: "receita",
    name: "Receita",
    description: "Crafting — insumos, saída e requisitos.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: RECEITA_SYSTEM_SCHEMA,
      },
      edges: { enabled: true, required: false, schema: edgesRelatedOnly() },
    }),
  },
  {
    slug: "recurso",
    name: "Recurso",
    description: "Materiais coletáveis e insumos do worldbuild.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: RECURSO_SYSTEM_SCHEMA,
      },
      edges: {
        enabled: true,
        required: false,
        schema: edgesWithTaxonomy(),
      },
    }),
  },
  {
    slug: "criatura",
    name: "Criatura",
    description:
      "Espécies animais e ameaças com ficha de combate — sempre folha (Espécie) da taxonomia.",
    aiPrompt: CRIATURA_AI_PROMPT,
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: NPC_STATS_SCHEMA,
      },
      visual: { enabled: true, required: false, schema: VISUAL_SCHEMA },
      edges: {
        enabled: true,
        required: false,
        schema: edgesSpeciesSheet(),
      },
    }),
  },
  {
    slug: "planta",
    name: "Planta",
    description:
      "Espécies vegetais do worldbuild — sempre folha (Espécie) sob NETSARIM.",
    aiPrompt: PLANTA_AI_PROMPT,
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: RECURSO_SYSTEM_SCHEMA,
      },
      visual: { enabled: true, required: false, schema: VISUAL_SCHEMA },
      edges: {
        enabled: true,
        required: false,
        schema: edgesSpeciesSheet(),
      },
    }),
  },
  {
    slug: "taxon",
    name: "Classificação",
    description:
      "Catálogo da Ordem dos Seres — Selos, Reinos e divisões acima da Espécie.",
    aiPrompt: TAXON_AI_PROMPT,
    facets: buildKindFacets({
      lore: { enabled: true, required: false, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: true,
        schema: TAXON_SYSTEM_SCHEMA,
      },
      edges: {
        enabled: true,
        required: false,
        schema: edgesTaxonCatalog(),
      },
    }),
  },
  {
    slug: "divindade",
    name: "Divindade",
    description: "Deuses, patronos e forças sagradas do worldbuild.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: DIVINDADE_SYSTEM_SCHEMA,
      },
      visual: { enabled: true, required: false, schema: VISUAL_SCHEMA },
      edges: {
        enabled: true,
        required: false,
        schema: edgesWithTaxonomy(),
      },
    }),
  },
  {
    slug: "organizacao",
    name: "Organização",
    description: "Guildas, nações, cultos e facções do worldbuild.",
    facets: buildKindFacets({
      lore: { enabled: true, required: true, schema: LORE_SCHEMA },
      system: {
        enabled: true,
        required: false,
        schema: ORGANIZACAO_SYSTEM_SCHEMA,
      },
      edges: {
        enabled: true,
        required: false,
        schema: edgesWithTaxonomy(),
      },
    }),
  },
  {
    slug: "termo",
    name: "Termo",
    description: "Entradas do léxico — palavras da língua antiga de Taeria.",
    facets: buildKindFacets({
      lore: { enabled: true, required: false, schema: LORE_SCHEMA },
      lexicon: {
        enabled: true,
        required: true,
        schema: TERMO_LEXICON_SCHEMA,
      },
      edges: { enabled: true, required: false, schema: edgesRelatedOnly() },
    }),
  },
];

async function findKindIdBySlug(
  admin: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("kind")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function upsertSeedKind(
  admin: SupabaseClient,
  seed: SeedKind,
): Promise<string> {
  const existingId = await findKindIdBySlug(admin, seed.slug);
  let kindId: string;

  if (existingId) {
    const { error: updateError } = await admin
      .from("kind")
      .update({
        name: seed.name,
        description: seed.description,
        ai_prompt: seed.aiPrompt ?? null,
      })
      .eq("id", existingId);

    if (updateError) {
      throw updateError;
    }

    kindId = existingId;
    console.log(`update  kind ${seed.slug}`);
  } else {
    const { data: kindRow, error: kindError } = await admin
      .from("kind")
      .insert({
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        ai_prompt: seed.aiPrompt ?? null,
        is_builtin: false,
      })
      .select("id")
      .single();

    if (kindError) {
      throw kindError;
    }

    kindId = kindRow.id;
    console.log(`seed  kind ${seed.slug}`);
  }

  const { error: facetError } = await admin.from("kind_facet_config").upsert(
    seed.facets.map((facet) => ({
      kind_id: kindId,
      facet_type: facet.facetType,
      enabled: facet.enabled,
      required: facet.required,
      display_order: facet.displayOrder,
      schema: facet.schema,
    })),
    { onConflict: "kind_id,facet_type" },
  );

  if (facetError) {
    throw facetError;
  }

  return kindId;
}

export async function seedTaeriaKinds(
  admin: SupabaseClient,
): Promise<Map<string, string>> {
  const { error: tableError } = await admin.from("kind").select("id").limit(1);

  if (tableError) {
    throw new Error(
      `Tabela kind indisponível (${tableError.message}). Rode make db-push antes do seed.`,
    );
  }

  const kindIds = new Map<string, string>();

  for (const kind of TAERIA_KINDS) {
    const id = await upsertSeedKind(admin, kind);
    kindIds.set(kind.slug, id);
  }

  return kindIds;
}
