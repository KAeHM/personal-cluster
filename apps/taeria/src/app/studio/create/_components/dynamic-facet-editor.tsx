"use client";

import type { FacetFieldDef } from "@/modules/worldbuild/application/schemas/facet-schema";
import { ImageUploadField } from "@/common/components/codex/image-upload-field";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Switch } from "@/common/components/ui/switch";
import { MarkdownFacetField } from "./markdown-facet-field";

type DynamicFacetEditorProps = {
  fields: FacetFieldDef[];
  values: Record<string, unknown>;
  expanded?: boolean;
  /** Empilha campos numéricos/texto em grade quando há vários. */
  dense?: boolean;
  onChange: (values: Record<string, unknown>) => void;
  uploadContext?: {
    kindSlug: string;
    entrySlug: string;
  };
};

function DynamicFacetEditor({
  fields,
  values,
  dense = false,
  onChange,
  uploadContext,
}: DynamicFacetEditorProps) {
  function updateField(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  const useGrid =
    dense &&
    fields.length > 1 &&
    fields.every(
      (field) =>
        field.fieldType === "number" ||
        field.fieldType === "string" ||
        field.fieldType === "boolean",
    );

  return (
    <div className={useGrid ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
      {fields.map((field) => {
        const value = values[field.key];

        if (field.fieldType === "image") {
          return (
            <ImageUploadField
              key={field.key}
              id={`facet-${field.key}`}
              label={field.label}
              value={typeof value === "string" ? value : ""}
              kindSlug={uploadContext?.kindSlug ?? ""}
              entrySlug={uploadContext?.entrySlug ?? ""}
              fieldKey={field.key}
              onChange={(url) => updateField(field.key, url)}
            />
          );
        }

        if (field.fieldType === "boolean") {
          return (
            <div key={field.key} className="flex items-center gap-2">
              <Switch
                id={`facet-${field.key}`}
                checked={Boolean(value)}
                onCheckedChange={(checked) => updateField(field.key, checked)}
              />
              <Label htmlFor={`facet-${field.key}`}>{field.label}</Label>
            </div>
          );
        }

        if (field.fieldType === "markdown") {
          return (
            <MarkdownFacetField
              key={field.key}
              id={`facet-${field.key}`}
              label={field.label}
              fieldKey={field.key}
              value={typeof value === "string" ? value : ""}
              onChange={(markdown) => updateField(field.key, markdown)}
              uploadContext={uploadContext}
            />
          );
        }

        if (field.fieldType === "number") {
          return (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={`facet-${field.key}`}>{field.label}</Label>
              <Input
                id={`facet-${field.key}`}
                type="number"
                value={typeof value === "number" ? value : ""}
                onChange={(event) =>
                  updateField(
                    field.key,
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  )
                }
              />
            </div>
          );
        }

        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={`facet-${field.key}`}>{field.label}</Label>
            <Input
              id={`facet-${field.key}`}
              value={typeof value === "string" ? value : ""}
              onChange={(event) => updateField(field.key, event.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}

export { DynamicFacetEditor };
