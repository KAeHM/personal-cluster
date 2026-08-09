"use client";

import { PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import type { Control } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import { Button } from "@/common/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/common/components/ui/form";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Switch } from "@/common/components/ui/switch";
import type { KindFormValues } from "./kind-form.types";
import type { ContentFacetType } from "@/modules/worldbuild/domain/facet-type";
import {
  DEFAULT_CONTENT_FACET_FIELDS,
  FACET_FIELD_TYPE_LABELS,
  WIKI_FIELD_PLACEMENT_LABELS,
  type FacetFieldType,
  type WikiFieldPlacement,
} from "./facet-schema-ui";

type FacetFieldsEditorProps = {
  control: Control<KindFormValues>;
  facetIndex: number;
  facetType: ContentFacetType;
  disabled?: boolean;
};

function FacetFieldsEditor({
  control,
  facetIndex,
  facetType,
  disabled = false,
}: FacetFieldsEditorProps) {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `contentFacets.${facetIndex}.fields`,
  });

  function resetDefaults() {
    replace(
      DEFAULT_CONTENT_FACET_FIELDS[facetType].map((field) => ({ ...field })),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Campos desta faceta</p>
          <p className="text-muted-foreground text-xs">
            Chaves usadas no codex — ex.:{" "}
            <code className="text-xs">lore_md</code>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={resetDefaults}
        >
          <RotateCcwIcon />
          Restaurar padrão
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field, fieldIndex) => (
          <FacetFieldRow
            key={field.id}
            control={control}
            facetIndex={facetIndex}
            fieldIndex={fieldIndex}
            disabled={disabled}
            canRemove={fields.length > 1}
            onRemove={() => remove(fieldIndex)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() =>
          append({
            key: "",
            label: "",
            fieldType: "string",
            required: false,
            wikiPlacement: "sidebar",
          })
        }
      >
        <PlusIcon />
        Adicionar campo
      </Button>
    </div>
  );
}

type FacetFieldRowProps = {
  control: Control<KindFormValues>;
  facetIndex: number;
  fieldIndex: number;
  disabled?: boolean;
  canRemove: boolean;
  onRemove: () => void;
};

function FacetFieldRow({
  control,
  facetIndex,
  fieldIndex,
  disabled = false,
  canRemove,
  onRemove,
}: FacetFieldRowProps) {
  const baseName = `contentFacets.${facetIndex}.fields.${fieldIndex}` as const;

  return (
    <div className="border-border bg-muted/20 grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto_auto] sm:items-end">
      <FormField
        control={control}
        name={`${baseName}.key`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Chave</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                placeholder="lore_md"
                className="font-mono text-xs"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${baseName}.label`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Rótulo</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                placeholder="Texto narrativo"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${baseName}.fieldType`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Tipo</FormLabel>
            <Select
              disabled={disabled}
              value={field.value}
              onValueChange={(value: FacetFieldType) => field.onChange(value)}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(
                  Object.entries(FACET_FIELD_TYPE_LABELS) as Array<
                    [FacetFieldType, string]
                  >
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${baseName}.wikiPlacement`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Wiki</FormLabel>
            <Select
              disabled={disabled}
              value={field.value}
              onValueChange={(value: WikiFieldPlacement) =>
                field.onChange(value)
              }
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(
                  Object.entries(WIKI_FIELD_PLACEMENT_LABELS) as Array<
                    [WikiFieldPlacement, string]
                  >
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`${baseName}.required`}
        render={({ field }) => (
          <FormItem className="flex flex-col justify-end gap-1.5 pb-2">
            <FormLabel className="text-xs">Obrigatório</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                disabled={disabled}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="flex justify-end pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || !canRemove}
          onClick={onRemove}
          aria-label="Remover campo"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

export { FacetFieldsEditor };
