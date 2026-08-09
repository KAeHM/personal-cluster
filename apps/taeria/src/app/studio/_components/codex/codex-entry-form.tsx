"use client";

import { useEffect, type ReactNode } from "react";

import type { Kind } from "@/modules/worldbuild/domain/kind";
import type { ContentFacetType } from "@/modules/worldbuild/domain/facet-type";
import {
  FACET_LABELS,
  STORED_FACET_TYPES,
} from "@/modules/worldbuild/domain/facet-type";
import {
  parseContentFacetSchema,
  parseEdgesFacetSchema,
  parseStoredFacetSchema,
  slugifyName,
} from "@/modules/worldbuild/application/schemas/facet-schema";
import { AppShell, useAppShell } from "@/common/components/layouts/app-shell";
import { LoreNovelEditor } from "@/common/components/codex/lore-novel-editor";
import { Badge } from "@/common/components/ui/badge";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { PanelRightIcon } from "lucide-react";
import { EdgesFacetEditor } from "@/app/studio/create/_components/edges-facet-editor";
import { CODEX_ENTRY_META_PANEL_ID } from "@/app/studio/create/constants";
import { DynamicFacetEditor } from "@/app/studio/create/_components/dynamic-facet-editor";
import { CodexFacetSection } from "./codex-facet-section";
import { CodexVisibilityPopover } from "./codex-visibility-popover";
import { CodexVisibilitySection } from "./codex-visibility-section";
import { CodexEntryMetaPortal, StudioToolbarPortal } from "./studio-portals";
import type { CodexFormValues } from "./codex-entry-form.types";

type CodexEntryFormProps = {
  kind: Kind | null;
  values: CodexFormValues;
  /** Layout: compact = painel do chat; page = documento + painel Detalhes. */
  layout?: "compact" | "page";
  expanded?: boolean;
  showVisibility?: boolean;
  kinds?: Kind[];
  onKindChange?: (kindSlug: string) => void;
  autoSlugFromTitle?: boolean;
  onChange: (values: CodexFormValues) => void;
  onRegenerateFacet?: (facetType: ContentFacetType) => void;
  /** Conteúdo à esquerda na toolbar (ex.: Voltar). */
  toolbarLeading?: ReactNode;
  /** Ações da toolbar (Salvar / Criar). */
  toolbarActions?: ReactNode;
  /** Conteúdo extra no fim do painel Detalhes. */
  panelFooter?: ReactNode;
  /** Abre o painel Detalhes ao montar (default true no layout page). */
  openMetaPanelOnMount?: boolean;
  editorKey?: string;
};

function CodexEntryForm({
  kind,
  values,
  layout = "compact",
  expanded = false,
  showVisibility = false,
  kinds,
  onKindChange,
  autoSlugFromTitle = false,
  onChange,
  onRegenerateFacet,
  toolbarLeading,
  toolbarActions,
  panelFooter,
  openMetaPanelOnMount = true,
  editorKey = "lore",
}: CodexEntryFormProps) {
  function patch(next: Partial<CodexFormValues>) {
    onChange({ ...values, ...next });
  }

  const isPage = layout === "page";

  const enabledStoredFacets = kind
    ? STORED_FACET_TYPES.filter((facetType) =>
        kind.facets.some(
          (facet) => facet.facetType === facetType && facet.enabled,
        ),
      )
    : [];

  const metaFacets = enabledStoredFacets.filter(
    (facetType) => facetType !== "lore",
  );

  const edgesEnabled = kind?.facets.some(
    (facet) => facet.facetType === "edges" && facet.enabled,
  );

  const relationTypes = kind
    ? parseEdgesFacetSchema(
        kind.facets.find((facet) => facet.facetType === "edges")?.schema ??
          null,
      )
    : [];

  const uploadContext =
    kind && values.slug
      ? { kindSlug: kind.slug, entrySlug: values.slug }
      : undefined;

  const loreEnabled = enabledStoredFacets.includes("lore");
  const loreMd =
    typeof values.facets.lore?.lore_md === "string"
      ? values.facets.lore.lore_md
      : "";

  function handleTitleChange(title: string) {
    if (!autoSlugFromTitle) {
      patch({ title });
      return;
    }

    const currentSlug = values.slug.trim();
    const titleSlug = slugifyName(values.title);
    const shouldSyncSlug =
      !currentSlug ||
      currentSlug === titleSlug ||
      currentSlug === slugifyName(title);

    patch({
      title,
      ...(shouldSyncSlug ? { slug: slugifyName(title) } : {}),
    });
  }

  function setLoreMd(markdown: string) {
    patch({
      facets: {
        ...values.facets,
        lore: { ...(values.facets.lore ?? {}), lore_md: markdown },
      },
    });
  }

  if (!isPage) {
    return (
      <div className="space-y-4">
        {kinds && onKindChange ? (
          <div className="space-y-2">
            <Label htmlFor="codex-kind">Tipo</Label>
            <Select
              value={kind?.slug ?? undefined}
              onValueChange={(value) => {
                if (value) onKindChange(value);
              }}
            >
              <SelectTrigger id="codex-kind" className="w-full">
                <SelectValue placeholder="Escolha o tipo da entrada" />
              </SelectTrigger>
              <SelectContent>
                {kinds.map((item) => (
                  <SelectItem key={item.id} value={item.slug}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : kind ? (
          <p className="text-muted-foreground text-xs">
            Tipo: <strong>{kind.name}</strong> ({kind.slug})
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Tipo ainda não definido — converse no chat ou escolha o formulário.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="codex-title">Título</Label>
          <Input
            id="codex-title"
            value={values.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="Espada de Valdris"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="codex-slug">Slug</Label>
          <Input
            id="codex-slug"
            value={values.slug}
            onChange={(event) => patch({ slug: event.target.value })}
            className="font-mono text-sm"
            placeholder="espada-de-valdris"
          />
        </div>

        {showVisibility ? (
          <CodexVisibilitySection
            visibility={values.visibility}
            sharedUserIds={values.sharedUserIds}
            onChange={(visibilityPatch) => patch(visibilityPatch)}
          />
        ) : null}

        {enabledStoredFacets.map((facetType) => {
          const fields =
            facetType === "visual"
              ? kind
                ? parseStoredFacetSchema(
                    kind.facets.find((facet) => facet.facetType === "visual")
                      ?.schema ?? null,
                    "visual",
                  )
                : []
              : kind
                ? parseContentFacetSchema(
                    kind.facets.find((facet) => facet.facetType === facetType)
                      ?.schema ?? null,
                    facetType,
                  )
                : [];

          return (
            <CodexFacetSection
              key={facetType}
              facetType={facetType}
              fields={fields}
              values={values.facets[facetType] ?? {}}
              expanded={expanded}
              onChange={(data) =>
                patch({
                  facets: { ...values.facets, [facetType]: data },
                })
              }
              onRegenerate={
                facetType !== "visual" && onRegenerateFacet
                  ? () => onRegenerateFacet(facetType as ContentFacetType)
                  : undefined
              }
              uploadContext={uploadContext}
            />
          );
        })}

        {edgesEnabled ? (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Relações</p>
            <EdgesFacetEditor
              relationTypes={relationTypes}
              edges={values.edges}
              onChange={(edges) => patch({ edges })}
            />
          </div>
        ) : null}
      </div>
    );
  }

  const loreExtraFields =
    loreEnabled && kind
      ? parseContentFacetSchema(
          kind.facets.find((facet) => facet.facetType === "lore")?.schema ??
            null,
          "lore",
        ).filter((field) => field.key !== "lore_md")
      : [];

  const metaPanel = (
    <div className="space-y-6 p-4">
      {kinds && onKindChange ? (
        <div className="space-y-1.5">
          <Label htmlFor="codex-kind-meta">Tipo</Label>
          <Select
            value={kind?.slug ?? undefined}
            onValueChange={(value) => {
              if (value) onKindChange(value);
            }}
          >
            <SelectTrigger id="codex-kind-meta" className="w-full">
              <SelectValue placeholder="Escolher tipo" />
            </SelectTrigger>
            <SelectContent>
              {kinds.map((item) => (
                <SelectItem key={item.id} value={item.slug}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : kind ? (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Tipo
          </p>
          <Badge variant="outline">{kind.name}</Badge>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="codex-slug">Slug</Label>
        <Input
          id="codex-slug"
          value={values.slug}
          onChange={(event) => patch({ slug: event.target.value })}
          className="font-mono text-sm"
          placeholder="identificador-url"
        />
      </div>

      {loreExtraFields.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {FACET_LABELS.lore} (campos)
          </p>
          <DynamicFacetEditor
            fields={loreExtraFields}
            values={values.facets.lore ?? {}}
            expanded
            dense
            onChange={(data) =>
              patch({
                facets: { ...values.facets, lore: data },
              })
            }
            uploadContext={uploadContext}
          />
        </div>
      ) : null}

      {metaFacets.map((facetType) => {
        const fields =
          facetType === "visual"
            ? kind
              ? parseStoredFacetSchema(
                  kind.facets.find((facet) => facet.facetType === "visual")
                    ?.schema ?? null,
                  "visual",
                )
              : []
            : kind
              ? parseContentFacetSchema(
                  kind.facets.find((facet) => facet.facetType === facetType)
                    ?.schema ?? null,
                  facetType,
                )
              : [];

        return (
          <div key={facetType} className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {FACET_LABELS[facetType]}
            </p>
            <DynamicFacetEditor
              fields={fields}
              values={values.facets[facetType] ?? {}}
              expanded
              dense
              onChange={(data) =>
                patch({
                  facets: { ...values.facets, [facetType]: data },
                })
              }
              uploadContext={uploadContext}
            />
          </div>
        );
      })}

      {edgesEnabled ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Relações
          </p>
          <EdgesFacetEditor
            relationTypes={relationTypes}
            edges={values.edges}
            onChange={(edges) => patch({ edges })}
          />
        </div>
      ) : null}

      {panelFooter}
    </div>
  );

  return (
    <>
      <OpenMetaPanelOnMount enabled={openMetaPanelOnMount} />

      <StudioToolbarPortal>
        <div className="flex items-center gap-1">
          {toolbarLeading}
          {kind ? (
            <Badge variant="outline" className="hidden sm:inline-flex">
              {kind.name}
            </Badge>
          ) : null}
          {showVisibility ? (
            <CodexVisibilityPopover
              visibility={values.visibility}
              sharedUserIds={values.sharedUserIds}
              onChange={(visibilityPatch) => patch(visibilityPatch)}
            />
          ) : null}
          {toolbarActions}
          <AppShell.PanelTrigger
            panelId={CODEX_ENTRY_META_PANEL_ID}
            aria-label="Abrir detalhes da entrada"
          >
            <PanelRightIcon className="size-4" />
          </AppShell.PanelTrigger>
        </div>
      </StudioToolbarPortal>

      <CodexEntryMetaPortal>{metaPanel}</CodexEntryMetaPortal>

      <div className="flex w-full max-w-none flex-col">
        <Input
          id="codex-title"
          value={values.title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Título"
          className="border-0 bg-transparent px-0 text-3xl font-semibold tracking-wide shadow-none focus-visible:ring-0 md:text-4xl"
          aria-label="Título"
        />

        {loreEnabled ? (
          <LoreNovelEditor
            value={loreMd}
            onChange={setLoreMd}
            editorKey={editorKey}
            placeholder="Comece a escrever o lore… Digite / para comandos."
            className="mt-0 w-full max-w-none"
            uploadContext={
              uploadContext
                ? { ...uploadContext, fieldKey: "lore_md" }
                : undefined
            }
          />
        ) : !kind ? (
          <p className="text-muted-foreground mt-6 text-sm">
            Abra Detalhes e escolha o tipo da entrada.
          </p>
        ) : null}
      </div>
    </>
  );
}

function OpenMetaPanelOnMount({ enabled }: { enabled: boolean }) {
  const { setPanelOpen } = useAppShell();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setPanelOpen(CODEX_ENTRY_META_PANEL_ID, true);
    return () => {
      setPanelOpen(CODEX_ENTRY_META_PANEL_ID, false);
    };
  }, [enabled, setPanelOpen]);

  return null;
}

export { CodexEntryForm };
