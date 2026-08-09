import type { ReactNode } from "react";
import type { FacetFieldDef } from "@/modules/worldbuild/application/schemas/facet-schema";
import type { StoredFacetType } from "@/modules/worldbuild/domain/facet-type";
import { FACET_LABELS } from "@/modules/worldbuild/domain/facet-type";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

type CodexFacetPreviewProps = {
  facetType: StoredFacetType;
  data: Record<string, unknown>;
  fields: FacetFieldDef[];
  lorePreview?: ReactNode;
};

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function renderFieldValue(
  field: FacetFieldDef,
  value: unknown,
  lorePreview?: ReactNode,
) {
  if (
    field.fieldType === "markdown" &&
    field.key === "lore_md" &&
    lorePreview
  ) {
    return lorePreview;
  }

  if (field.fieldType === "markdown") {
    return (
      <div key={field.key} className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium">
          {field.label}
        </p>
        <pre className="bg-muted/30 overflow-x-auto rounded-md p-3 text-xs whitespace-pre-wrap">
          {String(value)}
        </pre>
      </div>
    );
  }

  if (field.fieldType === "image" && typeof value === "string") {
    return (
      <div key={field.key} className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">
          {field.label}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt={field.label}
          className="max-h-64 w-full rounded-md border object-cover"
        />
        <p className="text-muted-foreground font-mono text-xs break-all">
          {value}
        </p>
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div key={field.key} className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium">
          {field.label}
        </p>
        <pre className="bg-muted/30 overflow-x-auto rounded-md p-3 text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div key={field.key}>
      <span className="text-muted-foreground">{field.label}: </span>
      <span>{String(value)}</span>
    </div>
  );
}

function CodexFacetPreview({
  facetType,
  data,
  fields,
  lorePreview,
}: CodexFacetPreviewProps) {
  const renderedFields = fields
    .filter((field) => !isEmptyValue(data[field.key]))
    .map((field) => renderFieldValue(field, data[field.key], lorePreview));

  const hasContent = renderedFields.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{FACET_LABELS[facetType]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {hasContent ? (
          renderedFields
        ) : fields.length === 0 && Object.keys(data).length > 0 ? (
          <pre className="bg-muted/30 overflow-x-auto rounded-md p-3 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p className="text-muted-foreground text-sm">Não preenchido</p>
        )}
      </CardContent>
    </Card>
  );
}

export { CodexFacetPreview };
