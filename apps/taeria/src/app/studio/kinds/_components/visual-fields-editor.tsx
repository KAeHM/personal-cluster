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
import {
  DEFAULT_VISUAL_FACET_FIELDS,
  FACET_FIELD_TYPE_LABELS,
  WIKI_FIELD_PLACEMENT_LABELS,
  type FacetFieldType,
  type WikiFieldPlacement,
} from "./facet-schema-ui";

type VisualFieldsEditorProps = {
  control: Control<KindFormValues>;
  disabled?: boolean;
};

function VisualFieldsEditor({
  control,
  disabled = false,
}: VisualFieldsEditorProps) {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "visualFacet.fields",
  });

  function resetDefaults() {
    replace(DEFAULT_VISUAL_FACET_FIELDS.map((field) => ({ ...field })));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Campos visuais</p>
          <p className="text-muted-foreground text-xs">
            Chaves usadas no codex — ex.:{" "}
            <code className="text-xs">banner_url</code>
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
          <div
            key={field.id}
            className="border-border bg-muted/20 grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto_auto] sm:items-end"
          >
            <FormField
              control={control}
              name={`visualFacet.fields.${fieldIndex}.key`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormLabel className="text-xs">Chave</FormLabel>
                  <FormControl>
                    <Input
                      {...inputField}
                      disabled={disabled}
                      placeholder="banner_url"
                      className="font-mono text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`visualFacet.fields.${fieldIndex}.label`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormLabel className="text-xs">Rótulo</FormLabel>
                  <FormControl>
                    <Input
                      {...inputField}
                      disabled={disabled}
                      placeholder="Banner"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`visualFacet.fields.${fieldIndex}.fieldType`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tipo</FormLabel>
                  <Select
                    disabled={disabled}
                    value={inputField.value}
                    onValueChange={(value: FacetFieldType) =>
                      inputField.onChange(value)
                    }
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
              name={`visualFacet.fields.${fieldIndex}.wikiPlacement`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormLabel className="text-xs">Wiki</FormLabel>
                  <Select
                    disabled={disabled}
                    value={inputField.value}
                    onValueChange={(value: WikiFieldPlacement) =>
                      inputField.onChange(value)
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
              name={`visualFacet.fields.${fieldIndex}.required`}
              render={({ field: inputField }) => (
                <FormItem className="flex flex-col justify-end gap-1.5 pb-2">
                  <FormLabel className="text-xs">Obrigatório</FormLabel>
                  <FormControl>
                    <Switch
                      checked={inputField.value}
                      disabled={disabled}
                      onCheckedChange={inputField.onChange}
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
                disabled={disabled || fields.length <= 1}
                onClick={() => remove(fieldIndex)}
                aria-label="Remover campo"
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
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
            fieldType: "image",
            required: false,
            wikiPlacement: "hidden",
          })
        }
      >
        <PlusIcon />
        Adicionar campo
      </Button>
    </div>
  );
}

export { VisualFieldsEditor };
