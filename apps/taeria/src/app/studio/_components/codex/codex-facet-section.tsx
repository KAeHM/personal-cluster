"use client";

import type { StoredFacetType } from "@/modules/worldbuild/domain/facet-type";
import { FACET_LABELS } from "@/modules/worldbuild/domain/facet-type";
import type { FacetFieldDef } from "@/modules/worldbuild/application/schemas/facet-schema";
import { DynamicFacetEditor } from "@/app/studio/create/_components/dynamic-facet-editor";
import { Button } from "@/common/components/ui/button";

type CodexFacetSectionProps = {
  facetType: StoredFacetType;
  fields: FacetFieldDef[];
  values: Record<string, unknown>;
  expanded?: boolean;
  /** Quando false, remove a borda/card (layout de página). */
  bordered?: boolean;
  /** Layout mais compacto para facetas secundárias. */
  dense?: boolean;
  onChange: (data: Record<string, unknown>) => void;
  onRegenerate?: () => void;
  uploadContext?: {
    kindSlug: string;
    entrySlug: string;
  };
};

function CodexFacetSection({
  facetType,
  fields,
  values,
  expanded = false,
  bordered = true,
  dense = false,
  onChange,
  onRegenerate,
  uploadContext,
}: CodexFacetSectionProps) {
  return (
    <div
      className={
        bordered
          ? "space-y-2 rounded-md border p-3"
          : dense
            ? "space-y-2"
            : "space-y-3"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={
            dense
              ? "text-muted-foreground text-xs font-medium tracking-wide uppercase"
              : "text-sm font-medium"
          }
        >
          {FACET_LABELS[facetType]}
        </p>
        {onRegenerate ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
          >
            Regenerar
          </Button>
        ) : null}
      </div>
      <DynamicFacetEditor
        fields={fields}
        values={values}
        expanded={expanded}
        dense={dense}
        onChange={onChange}
        uploadContext={uploadContext}
      />
    </div>
  );
}

export { CodexFacetSection };
