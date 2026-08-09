import { generateObject } from "ai";
import { z } from "zod";

import type { ContentFacetType } from "../../../domain/facet-type";
import type { Kind } from "../../../domain/kind";
import {
  getGeminiMaxOutputTokens,
  getGeminiModel,
} from "../../../infrastructure/ai/gemini.client";
import {
  parseContentFacetSchema,
  type FacetFieldDef,
} from "../../schemas/facet-schema";
import { TAERIA_GLOBAL_PROMPT } from "../prompts";
import type { FacetAgentOutput, GenerationContext } from "../types";

function facetAiPrompt(kind: Kind, facetType: ContentFacetType): string {
  const facet = kind.facets.find((item) => item.facetType === facetType);
  const parts = [kind.aiPrompt, facet?.aiPrompt].filter(Boolean);
  return parts.join("\n\n");
}

function buildDynamicSchema(kind: Kind, facetType: ContentFacetType) {
  const facetConfig = kind.facets.find((item) => item.facetType === facetType);
  const fields = parseContentFacetSchema(
    facetConfig?.schema ?? null,
    facetType,
  );

  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    let fieldSchema: z.ZodType = z.string();
    if (field.fieldType === "number") {
      fieldSchema = z.number();
    } else if (field.fieldType === "boolean") {
      fieldSchema = z.boolean();
    }
    shape[field.key] = field.required ? fieldSchema : fieldSchema.optional();
  }

  return { schema: z.object(shape), fields };
}

function formatFieldGuide(fields: FacetFieldDef[]): string {
  return fields
    .map((field) => {
      const required = field.required ? "obrigatório" : "opcional";
      return `- ${field.key} (${field.label}, ${field.fieldType}, ${required})`;
    })
    .join("\n");
}

function loreLengthGuidance(
  fields: FacetFieldDef[],
  userMessage?: string,
): string {
  const hasMarkdown = fields.some((field) => field.fieldType === "markdown");
  if (!hasMarkdown) {
    return "";
  }

  const inputLength = userMessage?.trim().length ?? 0;
  if (inputLength > 800) {
    return `O usuário enviou um texto longo (~${inputLength} caracteres). Preserve a riqueza narrativa: adapte e expanda o material fornecido em vez de resumir em poucos parágrafos. Campos markdown devem refletir a extensão e o detalhe do pedido.`;
  }

  return "Campos markdown devem ter profundidade narrativa adequada ao pedido — evite respostas de uma única frase quando o contexto pedir mais.";
}

async function runFacetAgent(
  facetType: ContentFacetType,
  context: GenerationContext,
  existing: Record<string, unknown> | undefined,
  tier: "fast" | "pro" = "fast",
): Promise<FacetAgentOutput> {
  const { schema, fields } = buildDynamicSchema(context.kind, facetType);
  const instructions = facetAiPrompt(context.kind, facetType);
  const fieldGuide = formatFieldGuide(fields);

  const { object } = await generateObject({
    model: getGeminiModel(tier),
    maxOutputTokens: getGeminiMaxOutputTokens(tier),
    schema,
    system: `${TAERIA_GLOBAL_PROMPT}

Você gera a faceta "${facetType}" de uma entrada do codex.
Preencha todos os campos do schema. Use as chaves exatas listadas abaixo.

Campos esperados:
${fieldGuide}

${loreLengthGuidance(fields, context.userMessage)}

${instructions ? `Instruções:\n${instructions}` : ""}

Contexto:
${JSON.stringify({
  userIntent: context.userIntent,
  styleNotes: context.styleNotes,
  systemRules: context.systemRules,
  constraints: context.constraints,
  worldTone: context.worldTone,
  resolvedRefs: context.resolvedRefs,
  canonNotes: context.canonNotes ?? [],
})}`,
    prompt: `Mensagem original do usuário:
${context.userMessage?.trim() || "(não informada)"}

Dados existentes (mesclar/atualizar se fizer sentido):
${JSON.stringify(existing ?? {})}`,
  });

  return {
    facetType,
    data: object as Record<string, unknown>,
  };
}

export async function runLoreAgent(
  context: GenerationContext,
  existing?: Record<string, unknown>,
): Promise<FacetAgentOutput> {
  return runFacetAgent("lore", context, existing, "pro");
}

export async function runSystemAgent(
  context: GenerationContext,
  existing?: Record<string, unknown>,
): Promise<FacetAgentOutput> {
  return runFacetAgent("system", context, existing, "fast");
}

export async function runLexiconAgent(
  context: GenerationContext,
  existing?: Record<string, unknown>,
): Promise<FacetAgentOutput> {
  return runFacetAgent("lexicon", context, existing, "fast");
}
