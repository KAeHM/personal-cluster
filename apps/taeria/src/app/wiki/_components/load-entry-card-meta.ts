import type { CodexEntry } from "@/modules/worldbuild/domain/codex-entry";
import { loreExcerpt } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import { getWikiCodexRepository } from "@/modules/worldbuild/infrastructure/wiki-codex.repository.factory";

export type EntryCardMeta = {
  loreExcerpt: string | null;
  bannerUrl?: string;
  systemPreview?: {
    slot?: string;
    insumos?: string;
    saida?: string;
    habilidadeMinima?: string;
  };
  lexiconTerm?: string;
};

function readString(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function buildSystemPreview(
  data: Record<string, unknown>,
): EntryCardMeta["systemPreview"] | undefined {
  const preview = {
    slot: readString(data, "slot"),
    insumos: readString(data, "insumos"),
    saida: readString(data, "saida"),
    habilidadeMinima: readString(data, "habilidade_minima"),
  };

  if (
    !preview.slot &&
    !preview.insumos &&
    !preview.saida &&
    !preview.habilidadeMinima
  ) {
    return undefined;
  }

  return preview;
}

function extractBannerUrl(entry: CodexEntry): string | undefined {
  const visual = entry.facets.find((facet) => facet.facetType === "visual");
  const url = visual?.data.banner_url;
  return typeof url === "string" && url.trim() !== "" ? url : undefined;
}

export async function loadEntryCardMeta(
  entryIds: string[],
): Promise<Map<string, EntryCardMeta>> {
  if (entryIds.length === 0) {
    return new Map();
  }

  const repo = await getWikiCodexRepository();
  const entries = await repo.findByIds(entryIds);

  return new Map(
    entries.map((entry) => {
      const systemFacet = entry.facets.find(
        (facet) => facet.facetType === "system",
      );
      const lexiconFacet = entry.facets.find(
        (facet) => facet.facetType === "lexicon",
      );

      return [
        entry.id,
        {
          loreExcerpt: loreExcerpt(entry),
          bannerUrl: extractBannerUrl(entry),
          systemPreview: systemFacet?.data
            ? buildSystemPreview(systemFacet.data)
            : undefined,
          lexiconTerm: lexiconFacet?.data
            ? readString(lexiconFacet.data, "term")
            : undefined,
        },
      ];
    }),
  );
}
