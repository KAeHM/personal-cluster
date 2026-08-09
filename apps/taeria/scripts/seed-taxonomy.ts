import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Catálogo da Ordem dos Seres (Aresht ben Nedar) — nós above Espécie.
 * Idempotente: upsert por slug + edges taxonomy filho→pai.
 */

type TaxonSeed = {
  slug: string;
  title: string;
  nivel: "selo" | "reino" | "classe";
  codigo: string;
  parentSlug?: string;
  loreMd: string;
  ordem: number;
};

const TAXON_ENTRIES: TaxonSeed[] = [
  // Selos
  {
    slug: "selo-hayim",
    title: "Selo ḤAYIM — Os Nascidos",
    nivel: "selo",
    codigo: "HAYIM",
    ordem: 1,
    loreMd:
      "Seres que surgem por processos biológicos, com ciclo de nascimento, crescimento, reprodução e morte.",
  },
  {
    slug: "selo-yetsarim",
    title: "Selo YETSARIM — Os Forjados",
    nivel: "selo",
    codigo: "YETSARIM",
    ordem: 2,
    loreMd:
      "Seres moldados, construídos ou convocados por vontade consciente — hostes, construtos, ecos e escrita viva.",
  },
  {
    slug: "selo-ruakhim",
    title: "Selo RUAKHIM — Os de Sopro",
    nivel: "selo",
    codigo: "RUAKHIM",
    ordem: 3,
    loreMd:
      "Entes de mana, sopro ou espírito, sem corpo fixo — ventos, brumas, ecos e luzes conscientes.",
  },
  // Reinos ḤAYIM
  {
    slug: "reino-hayoth",
    title: "Reino ḤAYOTH — Os Animais",
    nivel: "reino",
    codigo: "HAYOTH",
    parentSlug: "selo-hayim",
    ordem: 1,
    loreMd:
      "Seres com locomoção voluntária, percepção ativa e alimentação por ingestão. Inclui fauna e raças sapientes de corpo biológico.",
  },
  {
    slug: "reino-netsarim",
    title: "Reino NETSARIM — As Plantas",
    nivel: "reino",
    codigo: "NETSARIM",
    parentSlug: "selo-hayim",
    ordem: 2,
    loreMd:
      "Crescimento fixo ao substrato; energia por luz ou fluxos equivalentes. Árvores, ervas, vinhas e flora mágica.",
  },
  {
    slug: "reino-porim",
    title: "Reino PORIM — Fungos e Decompositores",
    nivel: "reino",
    codigo: "PORIM",
    parentSlug: "selo-hayim",
    ordem: 3,
    loreMd:
      "Nutrição por decomposição; esporos e micélios; reciclagem de matéria e mana.",
  },
  {
    slug: "reino-mikrim",
    title: "Reino MIKRIM — A Microvida",
    nivel: "reino",
    codigo: "MIKRIM",
    parentSlug: "selo-hayim",
    ordem: 4,
    loreMd:
      "Formas diminutas inferidas por efeitos — doenças, fermentações, simbioses e vetores de mana.",
  },
  // Reinos YETSARIM
  {
    slug: "reino-malakhim",
    title: "Reino MALAKHIM — Hostes e Anjos",
    nivel: "reino",
    codigo: "MALAKHIM",
    parentSlug: "selo-yetsarim",
    ordem: 1,
    loreMd:
      "Hostes a serviço dos deuses ou pactos antigos, com propósito intrínseco.",
  },
  {
    slug: "reino-golemim",
    title: "Reino GOLEMIM — Construtos",
    nivel: "reino",
    codigo: "GOLEMIM",
    parentSlug: "selo-yetsarim",
    ordem: 2,
    loreMd:
      "Formas moldadas em matéria e animadas por inscrição, runa ou núcleo de mana.",
  },
  {
    slug: "reino-eidolim",
    title: "Reino EIDOLIM — Ecos em Corpo",
    nivel: "reino",
    codigo: "EIDOLIM",
    parentSlug: "selo-yetsarim",
    ordem: 3,
    loreMd:
      "Alma ou eco preso a suporte — mortos-vivos conscientes, aparições corporificadas.",
  },
  {
    slug: "reino-kethavim",
    title: "Reino KETHAVIM — Seres de Escrita e Nome",
    nivel: "reino",
    codigo: "KETHAVIM",
    parentSlug: "selo-yetsarim",
    ordem: 4,
    loreMd:
      "Entidades cuja existência depende de palavras, contratos, sigilos e textos.",
  },
  // Reino RUAKHIM
  {
    slug: "reino-ruakhoth",
    title: "Reino RUAKHOTH — Espíritos Manifestos",
    nivel: "reino",
    codigo: "RUAKHOTH",
    parentSlug: "selo-ruakhim",
    ordem: 1,
    loreMd:
      "Ventos, brumas, sombras e vozes com vontade própria; ecos de lugares e guardiões sutis.",
  },
  // Classes iniciais ḤAYOTH
  {
    slug: "classe-mamiferos",
    title: "Mamíferos",
    nivel: "classe",
    codigo: "MAMALIA",
    parentSlug: "reino-hayoth",
    ordem: 1,
    loreMd: "Classe de ḤAYOTH — formas mamíferas e equivalentes taerianos.",
  },
  {
    slug: "classe-aves",
    title: "Aves",
    nivel: "classe",
    codigo: "AVES",
    parentSlug: "reino-hayoth",
    ordem: 2,
    loreMd: "Classe de ḤAYOTH — formas aladas e equivalentes taerianos.",
  },
  {
    slug: "classe-repteis",
    title: "Répteis",
    nivel: "classe",
    codigo: "REPTILIA",
    parentSlug: "reino-hayoth",
    ordem: 3,
    loreMd: "Classe de ḤAYOTH — formas répteis e equivalentes taerianos.",
  },
  {
    slug: "classe-peixes",
    title: "Peixes e aquáticos",
    nivel: "classe",
    codigo: "PISCES",
    parentSlug: "reino-hayoth",
    ordem: 4,
    loreMd: "Classe de ḤAYOTH — formas aquáticas nadadoras.",
  },
  {
    slug: "classe-artropodes",
    title: "Artrópodes",
    nivel: "classe",
    codigo: "ARTROPODA",
    parentSlug: "reino-hayoth",
    ordem: 5,
    loreMd: "Classe de ḤAYOTH — articulados, insetos e equivalentes.",
  },
  {
    slug: "classe-bestas-magicas",
    title: "Bestas mágicas",
    nivel: "classe",
    codigo: "BESTIA_ARCANA",
    parentSlug: "reino-hayoth",
    ordem: 6,
    loreMd:
      "Classe de ḤAYOTH — criaturas que nascem de pais e se alimentam, com órgãos ou dons de mana incomuns.",
  },
  // Classes iniciais NETSARIM
  {
    slug: "classe-arvores",
    title: "Árvores",
    nivel: "classe",
    codigo: "ARBOREA",
    parentSlug: "reino-netsarim",
    ordem: 1,
    loreMd: "Classe de NETSARIM — formas arbóreas e equivalentes.",
  },
  {
    slug: "classe-ervas",
    title: "Ervas e gramíneas",
    nivel: "classe",
    codigo: "HERBA",
    parentSlug: "reino-netsarim",
    ordem: 2,
    loreMd: "Classe de NETSARIM — ervas, gramíneas e pequenas plantas.",
  },
  {
    slug: "classe-vinhas",
    title: "Vinhas e trepadeiras",
    nivel: "classe",
    codigo: "VITIS",
    parentSlug: "reino-netsarim",
    ordem: 3,
    loreMd: "Classe de NETSARIM — vinhas e formas trepadoras.",
  },
  {
    slug: "classe-flora-magica",
    title: "Flora mágica",
    nivel: "classe",
    codigo: "FLORA_ARCANA",
    parentSlug: "reino-netsarim",
    ordem: 4,
    loreMd:
      "Classe de NETSARIM — plantas com órgãos de mana, frutos rituais ou proteção arcana.",
  },
];

async function findKindId(
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

async function upsertTaxonEntry(
  admin: SupabaseClient,
  kindId: string,
  seed: TaxonSeed,
): Promise<string> {
  const { data: existing } = await admin
    .from("codex_entry")
    .select("id")
    .eq("slug", seed.slug)
    .maybeSingle();

  let entryId: string;

  if (existing) {
    const { error } = await admin
      .from("codex_entry")
      .update({
        title: seed.title,
        visibility: "public",
        kind_id: kindId,
      })
      .eq("id", existing.id);
    if (error) {
      throw error;
    }
    entryId = existing.id;
    console.log(`update  taxon ${seed.slug}`);
  } else {
    const { data, error } = await admin
      .from("codex_entry")
      .insert({
        slug: seed.slug,
        title: seed.title,
        kind_id: kindId,
        visibility: "public",
      })
      .select("id")
      .single();
    if (error) {
      throw error;
    }
    entryId = data.id;
    console.log(`seed  taxon ${seed.slug}`);
  }

  const { error: loreError } = await admin.from("codex_facet").upsert(
    {
      entry_id: entryId,
      facet_type: "lore",
      data: { lore_md: seed.loreMd },
    },
    { onConflict: "entry_id,facet_type" },
  );
  if (loreError) {
    throw loreError;
  }

  const { error: systemError } = await admin.from("codex_facet").upsert(
    {
      entry_id: entryId,
      facet_type: "system",
      data: {
        nivel: seed.nivel,
        codigo: seed.codigo,
        ordem: seed.ordem,
      },
    },
    { onConflict: "entry_id,facet_type" },
  );
  if (systemError) {
    throw systemError;
  }

  return entryId;
}

export async function seedTaeriaTaxonomy(admin: SupabaseClient): Promise<void> {
  const kindId = await findKindId(admin, "taxon");
  if (!kindId) {
    console.log("skip  taxonomy catalog (kind taxon ausente)");
    return;
  }

  const idsBySlug = new Map<string, string>();

  for (const seed of TAXON_ENTRIES) {
    const id = await upsertTaxonEntry(admin, kindId, seed);
    idsBySlug.set(seed.slug, id);
  }

  for (const seed of TAXON_ENTRIES) {
    if (!seed.parentSlug) {
      continue;
    }
    const childId = idsBySlug.get(seed.slug);
    const parentId = idsBySlug.get(seed.parentSlug);
    if (!childId || !parentId) {
      continue;
    }

    const { data: existingEdge } = await admin
      .from("codex_edge")
      .select("id")
      .eq("from_entry_id", childId)
      .eq("edge_type", "taxonomy")
      .maybeSingle();

    if (existingEdge) {
      const { error } = await admin
        .from("codex_edge")
        .update({ to_entry_id: parentId, payload: { rank: seed.ordem } })
        .eq("id", existingEdge.id);
      if (error) {
        throw error;
      }
    } else {
      const { error } = await admin.from("codex_edge").insert({
        from_entry_id: childId,
        to_entry_id: parentId,
        edge_type: "taxonomy",
        payload: { rank: seed.ordem },
      });
      if (error) {
        throw error;
      }
    }
  }

  console.log(`seed  taxonomy catalog (${TAXON_ENTRIES.length} nós)`);
}

export { TAXON_ENTRIES };
