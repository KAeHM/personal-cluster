"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { PlusIcon, Trash2Icon } from "lucide-react";

import {
  CONTENT_FACET_TYPES,
  FACET_LABELS,
} from "@/modules/worldbuild/domain/facet-type";
import {
  createKindAction,
  updateKindAction,
} from "@/modules/worldbuild/presentation/actions/kind.actions";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/common/components/ui/separator";
import { Switch } from "@/common/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import { Textarea } from "@/common/components/ui/textarea";
import { Spinner } from "@/common/components/feedback/spinner";
import { FacetFieldsEditor } from "./facet-fields-editor";
import { VisualFieldsEditor } from "./visual-fields-editor";
import {
  DEFAULT_EDGE_RELATION_TYPES,
  defaultEdgesFacet,
  slugifyName,
  WIKI_EDGE_PLACEMENT_LABELS,
  type WikiEdgePlacement,
} from "./facet-schema-ui";
import { formValuesToKindPayload } from "./kind-form.mappers";
import {
  buildDefaultKindFormValues,
  kindFormSchemaWithRules,
  type KindFormValues,
} from "./kind-form.types";

type KindFormProps = {
  mode: "create" | "edit";
  kindId?: string;
  defaultValues?: KindFormValues;
  slugDisabled?: boolean;
};

function KindForm({
  mode,
  kindId,
  defaultValues,
  slugDisabled = false,
}: KindFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [activeFacetTab, setActiveFacetTab] = useState("lore");
  const slugManuallyEdited = useRef(false);

  const form = useForm<KindFormValues>({
    resolver: zodResolver(kindFormSchemaWithRules),
    defaultValues: defaultValues ?? buildDefaultKindFormValues(),
  });

  const name = useWatch({ control: form.control, name: "name" });
  const contentFacets = useWatch({
    control: form.control,
    name: "contentFacets",
  });
  const edgesFacet = useWatch({ control: form.control, name: "edgesFacet" });
  const visualFacet = useWatch({ control: form.control, name: "visualFacet" });

  useEffect(() => {
    if (mode !== "create" || slugDisabled || slugManuallyEdited.current) {
      return;
    }

    const nextSlug = slugifyName(name ?? "");
    if (nextSlug) {
      form.setValue("slug", nextSlug, { shouldDirty: true });
    }
  }, [form, mode, name, slugDisabled]);

  function onSubmit(values: KindFormValues) {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createKindAction(formValuesToKindPayload(values))
          : await updateKindAction(kindId!, formValuesToKindPayload(values));

      if (!result.ok) {
        setFormError(result.message ?? "Não foi possível salvar.");
        return;
      }

      router.push("/studio/kinds");
      router.refresh();
    });
  }

  function contentFacetIndex(facetType: (typeof CONTENT_FACET_TYPES)[number]) {
    return CONTENT_FACET_TYPES.indexOf(facetType);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-6 xl:sticky xl:top-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Identidade</CardTitle>
                <CardDescription>
                  Nome visível e identificador técnico do tipo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={pending}
                          placeholder="Arma"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificador (slug)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={slugDisabled || pending}
                          placeholder="weapon"
                          className="font-mono text-sm"
                          onChange={(event) => {
                            slugManuallyEdited.current = true;
                            field.onChange(event);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Kebab-case — usado em URLs e referências internas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={pending}
                          rows={4}
                          placeholder="Equipamento ofensivo ou defensivo usado em Taeria…"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Instruções para IA</CardTitle>
                <CardDescription>
                  Orientações para geração futura de entidades deste tipo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="aiPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={pending}
                          rows={6}
                          placeholder="Ao criar uma arma, descreva material, origem em Taeria e uso típico na mesa…"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Facetas</CardTitle>
              <CardDescription>
                Defina o que cada entrada deste tipo pode armazenar no codex.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeFacetTab} onValueChange={setActiveFacetTab}>
                <TabsList className="mb-4 h-auto w-full flex-wrap justify-start">
                  {CONTENT_FACET_TYPES.map((facetType) => {
                    const index = contentFacetIndex(facetType);
                    const facet = contentFacets?.[index];
                    return (
                      <TabsTrigger
                        key={facetType}
                        value={facetType}
                        className="gap-2"
                      >
                        {FACET_LABELS[facetType]}
                        {facet?.enabled ? (
                          <Badge variant="secondary" className="px-1.5 py-0">
                            on
                          </Badge>
                        ) : null}
                      </TabsTrigger>
                    );
                  })}
                  <TabsTrigger value="visual" className="gap-2">
                    Visual
                    {visualFacet?.enabled ? (
                      <Badge variant="secondary" className="px-1.5 py-0">
                        on
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="edges" className="gap-2">
                    Relações
                    {edgesFacet?.enabled ? (
                      <Badge variant="secondary" className="px-1.5 py-0">
                        on
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="embeddings">Busca</TabsTrigger>
                </TabsList>

                {CONTENT_FACET_TYPES.map((facetType) => {
                  const index = contentFacetIndex(facetType);
                  const facet = contentFacets?.[index];

                  return (
                    <TabsContent
                      key={facetType}
                      value={facetType}
                      className="space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            {FACET_LABELS[facetType]}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {facetType === "lore"
                              ? "Texto narrativo em Markdown e campos de lore."
                              : facetType === "system"
                                ? "Dados mecânicos e regras do RPG."
                                : "Termos e traduções do léxico antigo."}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <FormField
                            control={form.control}
                            name={`contentFacets.${index}.enabled`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormLabel className="text-sm font-normal">
                                  Habilitada
                                </FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    disabled={pending}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      if (!checked) {
                                        form.setValue(
                                          `contentFacets.${index}.required`,
                                          false,
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`contentFacets.${index}.required`}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormLabel className="text-sm font-normal">
                                  Obrigatória
                                </FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    disabled={pending || !facet?.enabled}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {facet?.enabled ? (
                        <>
                          <FormField
                            control={form.control}
                            name={`contentFacets.${index}.aiPrompt`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Instruções de IA desta faceta
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    disabled={pending}
                                    rows={3}
                                    placeholder={`Orientações específicas para gerar ${FACET_LABELS[facetType].toLowerCase()}…`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FacetFieldsEditor
                            control={form.control}
                            facetIndex={index}
                            facetType={facetType}
                            disabled={pending}
                          />
                        </>
                      ) : (
                        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
                          Habilite esta faceta para configurar os campos.
                        </p>
                      )}
                    </TabsContent>
                  );
                })}

                <TabsContent value="visual" className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Visual</p>
                      <p className="text-muted-foreground text-sm">
                        Imagens e assets visuais — upload manual, fora do escopo
                        da IA.
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="visualFacet.enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormLabel className="text-sm font-normal">
                            Habilitada
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              disabled={pending}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {visualFacet?.enabled ? (
                    <VisualFieldsEditor
                      control={form.control}
                      disabled={pending}
                    />
                  ) : (
                    <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
                      Habilite a faceta visual para configurar campos de imagem
                      como banner.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="edges" className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Relações</p>
                      <p className="text-muted-foreground text-sm">
                        Tipos de vínculo permitidos entre entradas do codex.
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="edgesFacet.enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormLabel className="text-sm font-normal">
                            Habilitada
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              disabled={pending}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {edgesFacet?.enabled ? (
                    <EdgesRelationTypesEditor
                      control={form.control}
                      setValue={form.setValue}
                      disabled={pending}
                    />
                  ) : (
                    <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
                      Habilite relações para definir tipos como{" "}
                      <code className="text-xs">related_to</code> e{" "}
                      <code className="text-xs">taxonomy</code>.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="embeddings" className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Busca semântica</p>
                      <p className="text-muted-foreground text-sm">
                        Reservado para indexação e RAG no codex (fase futura).
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="embeddingsFacet.enabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormLabel className="text-sm font-normal">
                            Habilitada
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              disabled={pending}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Por enquanto basta marcar se entradas deste tipo devem ser
                    indexadas quando o RAG estiver ativo.
                  </p>
                </TabsContent>
              </Tabs>

              {form.formState.errors.contentFacets?.message ? (
                <p className="text-destructive mt-4 text-sm" role="alert">
                  {form.formState.errors.contentFacets.message}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {formError ? (
          <p
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive border px-3 py-2 text-sm"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner size="sm" /> : null}
            {mode === "create" ? "Criar tipo" : "Salvar alterações"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push("/studio/kinds")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}

type EdgesRelationTypesEditorProps = {
  control: Control<KindFormValues>;
  setValue: UseFormSetValue<KindFormValues>;
  disabled?: boolean;
};

function EdgesRelationTypesEditor({
  control,
  setValue,
  disabled = false,
}: EdgesRelationTypesEditorProps) {
  const relationTypes =
    useWatch({ control, name: "edgesFacet.relationTypes" }) ?? [];
  const wikiPlacements =
    useWatch({ control, name: "edgesFacet.wikiPlacements" }) ?? {};

  function setEdgePlacement(edgeType: string, placement: WikiEdgePlacement) {
    setValue(
      "edgesFacet.wikiPlacements",
      { ...wikiPlacements, [edgeType]: placement },
      { shouldDirty: true },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Tipos de relação</p>
          <p className="text-muted-foreground text-xs">
            Snake_case — ex.: related_to, taxonomy.{" "}
            <code className="text-xs">related_to</code> sempre aparece no final
            da wiki.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => {
            setValue(
              "edgesFacet.relationTypes",
              [...DEFAULT_EDGE_RELATION_TYPES],
              { shouldDirty: true },
            );
            setValue(
              "edgesFacet.wikiPlacements",
              defaultEdgesFacet().wikiPlacements,
              { shouldDirty: true },
            );
          }}
        >
          Restaurar padrão
        </Button>
      </div>

      <div className="space-y-2">
        {relationTypes.map((relationType, index) => (
          <div
            key={`relation-type-${index}`}
            className="border-border bg-muted/20 grid gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_auto] sm:items-end"
          >
            <FormField
              control={control}
              name={`edgesFacet.relationTypes.${index}`}
              render={({ field: inputField }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tipo</FormLabel>
                  <FormControl>
                    <Input
                      {...inputField}
                      disabled={disabled}
                      placeholder="related_to"
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {relationType.trim() === "related_to" ? (
              <div className="pb-2">
                <p className="text-xs font-medium">Wiki</p>
                <p className="text-muted-foreground text-xs">
                  Seção final (fixo)
                </p>
              </div>
            ) : (
              <FormItem>
                <FormLabel className="text-xs">Wiki</FormLabel>
                <Select
                  disabled={disabled || !relationType.trim()}
                  value={
                    wikiPlacements[relationType.trim()] ??
                    (relationType.trim() === "written_by" ||
                    relationType.trim() === "crafted_by"
                      ? "sidebar"
                      : "hidden")
                  }
                  onValueChange={(value: WikiEdgePlacement) =>
                    setEdgePlacement(relationType.trim(), value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(WIKI_EDGE_PLACEMENT_LABELS) as Array<
                        [WikiEdgePlacement, string]
                      >
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}

            <div className="flex justify-end pb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || relationTypes.length <= 1}
                onClick={() =>
                  setValue(
                    "edgesFacet.relationTypes",
                    relationTypes.filter((_, itemIndex) => itemIndex !== index),
                    { shouldDirty: true },
                  )
                }
                aria-label="Remover tipo"
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
          setValue("edgesFacet.relationTypes", [...relationTypes, ""], {
            shouldDirty: true,
          })
        }
      >
        <PlusIcon />
        Adicionar tipo
      </Button>
    </div>
  );
}

export { KindForm, buildDefaultKindFormValues as buildDefaultFacets };
export type { KindFormValues } from "./kind-form.types";
