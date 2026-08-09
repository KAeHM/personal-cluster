"use client";

import Link from "next/link";

import { CodexFacetPreview } from "@/app/studio/_components/codex/codex-facet-preview";
import { LoreNovelPreview } from "@/common/components/codex/lore-novel-preview";
import type { Kind } from "@/modules/worldbuild/domain/kind";
import type {
  CodexEdgeWithTarget,
  CodexEntry,
} from "@/modules/worldbuild/domain/codex-entry";
import {
  CONTENT_FACET_TYPES,
  FACET_LABELS,
} from "@/modules/worldbuild/domain/facet-type";
import {
  parseContentFacetSchema,
  parseStoredFacetSchema,
} from "@/modules/worldbuild/application/schemas/facet-schema";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";

type CodexEntryDetailTabsProps = {
  entry: CodexEntry;
  kind: Kind;
  edgesWithTargets: CodexEdgeWithTarget[];
};

function CodexEntryDetailTabs({
  entry,
  kind,
  edgesWithTargets,
}: CodexEntryDetailTabsProps) {
  const enabledContentFacets = CONTENT_FACET_TYPES.filter((facetType) =>
    kind.facets.some((facet) => facet.facetType === facetType && facet.enabled),
  );

  const visualEnabled = kind.facets.some(
    (facet) => facet.facetType === "visual" && facet.enabled,
  );

  const edgesEnabled = kind.facets.some(
    (facet) => facet.facetType === "edges" && facet.enabled,
  );

  const defaultTab =
    enabledContentFacets[0] ??
    (visualEnabled ? "visual" : edgesEnabled ? "relations" : "lore");

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="h-auto w-full flex-wrap justify-start">
        {enabledContentFacets.map((facetType) => (
          <TabsTrigger key={facetType} value={facetType}>
            {FACET_LABELS[facetType]}
          </TabsTrigger>
        ))}
        {visualEnabled ? (
          <TabsTrigger value="visual">{FACET_LABELS.visual}</TabsTrigger>
        ) : null}
        {edgesEnabled ? (
          <TabsTrigger value="relations">{FACET_LABELS.edges}</TabsTrigger>
        ) : null}
      </TabsList>

      {enabledContentFacets.map((facetType) => {
        const facet = entry.facets.find((f) => f.facetType === facetType);
        const fields = parseContentFacetSchema(
          kind.facets.find((f) => f.facetType === facetType)?.schema ?? null,
          facetType,
        );

        return (
          <TabsContent key={facetType} value={facetType}>
            {facet ? (
              <CodexFacetPreview
                facetType={facetType}
                data={facet.data}
                fields={fields}
                lorePreview={
                  facetType === "lore" &&
                  typeof facet.data.lore_md === "string" ? (
                    <LoreNovelPreview markdown={facet.data.lore_md} />
                  ) : undefined
                }
              />
            ) : (
              <CodexFacetPreview
                facetType={facetType}
                data={{}}
                fields={fields}
              />
            )}
          </TabsContent>
        );
      })}

      {visualEnabled ? (
        <TabsContent value="visual">
          {(() => {
            const facet = entry.facets.find((f) => f.facetType === "visual");
            const fields = parseStoredFacetSchema(
              kind.facets.find((f) => f.facetType === "visual")?.schema ?? null,
              "visual",
            );

            return (
              <CodexFacetPreview
                facetType="visual"
                data={facet?.data ?? {}}
                fields={fields}
              />
            );
          })()}
        </TabsContent>
      ) : null}

      {edgesEnabled ? (
        <TabsContent value="relations">
          {edgesWithTargets.length > 0 ? (
            <div className="space-y-2 rounded-md border p-4 text-sm">
              {edgesWithTargets.map((edge) => (
                <p key={edge.id}>
                  <code>{edge.edgeType}</code>
                  {" → "}
                  {edge.toEntry ? (
                    <Link
                      href={`/studio/entries/${edge.toEntry.id}`}
                      className="hover:underline"
                    >
                      {edge.toEntry.title}{" "}
                      <span className="text-muted-foreground font-mono text-xs">
                        ({edge.toEntry.slug})
                      </span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">
                      entrada removida
                    </span>
                  )}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
              Não preenchido
            </p>
          )}
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

export { CodexEntryDetailTabs };
