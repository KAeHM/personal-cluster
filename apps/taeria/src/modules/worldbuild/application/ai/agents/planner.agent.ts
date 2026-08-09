import { generateObject } from "ai";
import { z } from "zod";

import type { StudioTurn } from "../../../domain/studio-turn";
import {
  getGeminiMaxOutputTokens,
  getGeminiModel,
} from "../../../infrastructure/ai/gemini.client";
import { TAERIA_GLOBAL_PROMPT } from "../prompts";
import type { PlannerOutput } from "../types";
import { slugifyName } from "../../schemas/facet-schema";
import type { Kind } from "../../../domain/kind";

const plannerSchema = z.object({
  intent: z.enum(["create", "edit_facet", "clarify", "regenerate"]),
  kindSlug: z.string().nullable(),
  title: z.string().nullable(),
  slug: z.string().nullable(),
  slots: z.record(z.string(), z.string()).default({}),
  agentsToRun: z.array(z.enum(["lore", "system", "lexicon"])).default(["lore"]),
  summary: z.string(),
});

export async function runPlannerAgent(
  turn: StudioTurn,
  kinds: Kind[],
): Promise<PlannerOutput> {
  const kindList = kinds
    .map((kind) => `- ${kind.slug}: ${kind.name}`)
    .join("\n");

  const { object } = await generateObject({
    model: getGeminiModel("fast"),
    maxOutputTokens: getGeminiMaxOutputTokens("fast"),
    schema: plannerSchema,
    system: `${TAERIA_GLOBAL_PROMPT}

Você é o planejador do Studio Create. Classifique a intenção do usuário e escolha kind e agentes.
A faceta visual (imagens) é sempre manual — nunca inclua agentes para ela.
Kinds disponíveis:
${kindList}`,
    prompt: `Draft atual:
${JSON.stringify(turn.draft, null, 2)}

Último evento: ${turn.lastEvent ? JSON.stringify(turn.lastEvent) : "nenhum"}
Foco: ${turn.focus ?? "nenhum"}

Mensagem do usuário:
${turn.message ?? "(sem mensagem)"}`,
  });

  const title = object.title ?? turn.draft.title;
  const slug =
    object.slug ?? turn.draft.slug ?? (title ? slugifyName(title) : null);

  return {
    ...object,
    title,
    slug,
  };
}

export function fallbackPlanner(
  turn: StudioTurn,
  kinds: Kind[],
): PlannerOutput {
  const message = turn.message?.toLowerCase() ?? "";

  if (turn.lastEvent?.type === "regenerate_facet") {
    return {
      intent: "regenerate",
      kindSlug: turn.draft.kindSlug,
      title: turn.draft.title,
      slug: turn.draft.slug,
      slots: {},
      agentsToRun: [turn.lastEvent.facetType],
      summary: `Regenerar faceta ${turn.lastEvent.facetType}.`,
    };
  }

  const matchedKind =
    kinds.find((kind) => message.includes(kind.slug)) ??
    kinds.find((kind) => message.includes(kind.name.toLowerCase()));

  const intent =
    turn.lastEvent?.type === "user_edited_facet" ? "edit_facet" : "create";

  return {
    intent,
    kindSlug: turn.draft.kindSlug ?? matchedKind?.slug ?? null,
    title: turn.draft.title,
    slug: turn.draft.slug,
    slots: {},
    agentsToRun: ["lore", "system"],
    summary: turn.message ?? "Continuar criação.",
  };
}
