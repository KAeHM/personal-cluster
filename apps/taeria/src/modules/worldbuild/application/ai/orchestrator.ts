import type { CodexDraft } from "../../domain/codex-draft";
import type { StudioMessagePart } from "../../domain/studio-message-part";
import type { StudioTurn } from "../../domain/studio-turn";
import type { ContentFacetType } from "../../domain/facet-type";
import { CONTENT_FACET_TYPES } from "../../domain/facet-type";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import { isGeminiConfigured } from "../../infrastructure/ai/gemini.client";
import { CODEX_ERRORS } from "../../domain/errors";
import { validateCodexDraft } from "../schemas/validate-codex-draft";
import { validateFacetData } from "../schemas/compile-facet-zod";
import { fallbackPlanner, runPlannerAgent } from "./agents/planner.agent";
import { buildFallbackContext, runContextAgent } from "./agents/context.agent";
import {
  runLexiconAgent,
  runLoreAgent,
  runSystemAgent,
} from "./agents/facet.agents";
import { resolveEdges } from "./edges-resolver";
import {
  mergeDraftEdges,
  mergeDraftIdentity,
  mergeFacetPatches,
} from "./merge-draft";
import type { FacetAgentOutput } from "./types";

export interface OrchestratorResult {
  draft: CodexDraft;
  parts: StudioMessagePart[];
}

const MAX_FACET_RETRIES = 2;

function setPhase(
  draft: CodexDraft,
  phase: CodexDraft["meta"]["phase"],
): CodexDraft {
  return {
    ...draft,
    meta: { ...draft.meta, phase },
  };
}

async function generateFacetWithRetry(
  facetType: ContentFacetType,
  context: Awaited<ReturnType<typeof runContextAgent>>,
  existing: Record<string, unknown> | undefined,
): Promise<FacetAgentOutput> {
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt <= MAX_FACET_RETRIES; attempt++) {
    const output = await (async () => {
      switch (facetType) {
        case "lore":
          return runLoreAgent(context, existing);
        case "system":
          return runSystemAgent(context, existing);
        case "lexicon":
          return runLexiconAgent(context, existing);
      }
    })();

    const validation = validateFacetData(context.kind, facetType, output.data);
    if (validation.success) {
      return { facetType, data: validation.data };
    }

    lastErrors = validation.errors;
    if (attempt === MAX_FACET_RETRIES) {
      throw CODEX_ERRORS.create("VALIDATION_FAILED", {
        meta: { facetType, errors: lastErrors },
      });
    }
  }

  throw CODEX_ERRORS.create("VALIDATION_FAILED", {
    meta: { facetType, errors: lastErrors },
  });
}

function buildParts(draft: CodexDraft, summary: string): StudioMessagePart[] {
  const parts: StudioMessagePart[] = [{ type: "text", text: summary }];

  for (const facetType of CONTENT_FACET_TYPES) {
    if (draft.facets[facetType]) {
      parts.push({ type: "facet_editor", facetType });
    }
    const errors = draft.meta.validationErrors[facetType];
    if (errors?.length) {
      parts.push({ type: "validation", facetType, errors });
    }
  }

  if (draft.edges.length > 0) {
    parts.push({ type: "edges_editor" });
  }

  parts.push({
    type: "action",
    action: "create_entry",
    label: "Criar entidade",
    disabled: draft.meta.phase !== "ready",
  });

  return parts;
}

export async function orchestrateStudioTurn(
  turn: StudioTurn,
): Promise<OrchestratorResult> {
  if (!isGeminiConfigured()) {
    throw CODEX_ERRORS.create("AI_UNAVAILABLE");
  }

  let draft = setPhase(turn.draft, "planning");
  const kindRepo = await getKindRepository();
  const kinds = await kindRepo.list();

  let planner;
  try {
    planner = await runPlannerAgent(turn, kinds);
  } catch {
    planner = fallbackPlanner(turn, kinds);
  }

  if (
    planner.intent === "clarify" &&
    !planner.kindSlug &&
    !turn.draft.kindSlug
  ) {
    draft = setPhase(draft, "idle");
    return {
      draft,
      parts: [
        {
          type: "text",
          text: planner.summary || "Qual tipo de entidade você quer criar?",
        },
        {
          type: "decision",
          key: "kindSlug",
          label: "Escolha o tipo",
          options: kinds.map((kind) => ({
            value: kind.slug,
            label: kind.name,
          })),
        },
      ],
    };
  }

  const kindSlug = turn.draft.kindSlug ?? planner.kindSlug;
  if (!kindSlug) {
    draft = setPhase(draft, "idle");
    return {
      draft,
      parts: [
        {
          type: "text",
          text: "Preciso saber o tipo da entidade antes de continuar.",
        },
        {
          type: "decision",
          key: "kindSlug",
          label: "Tipo de entidade",
          options: kinds.map((kind) => ({
            value: kind.slug,
            label: kind.name,
          })),
        },
      ],
    };
  }

  const kind = await kindRepo.findBySlug(kindSlug);
  if (!kind) {
    throw CODEX_ERRORS.create("KIND_NOT_FOUND", { meta: { kindSlug } });
  }

  draft = mergeDraftIdentity(draft, {
    kindSlug,
    title: planner.title,
    slug: planner.slug,
  });
  draft = setPhase(draft, "gathering");

  let context;
  try {
    context = await runContextAgent(planner, draft, kind, turn.message);
  } catch {
    context = buildFallbackContext(planner, kind, turn.message);
  }

  draft = setPhase(draft, "generating");

  const agentsToRun = new Set(planner.agentsToRun);
  if (
    planner.intent === "regenerate" &&
    turn.lastEvent?.type === "regenerate_facet"
  ) {
    agentsToRun.add(turn.lastEvent.facetType);
  }

  const forceFacetTypes =
    turn.lastEvent?.type === "regenerate_facet"
      ? [turn.lastEvent.facetType]
      : undefined;

  const facetJobs = CONTENT_FACET_TYPES.filter(
    (facetType) =>
      agentsToRun.has(facetType) &&
      kind.facets.some(
        (facet) => facet.facetType === facetType && facet.enabled,
      ),
  );

  const patches: FacetAgentOutput[] = [];
  for (const facetType of facetJobs) {
    if (
      draft.meta.userEdited[facetType] &&
      turn.lastEvent?.type !== "regenerate_facet"
    ) {
      continue;
    }

    const patch = await generateFacetWithRetry(
      facetType,
      context,
      draft.facets[facetType],
    );
    patches.push(patch);
  }

  draft = mergeFacetPatches(draft, patches, { forceFacetTypes });
  draft = mergeDraftEdges(draft, resolveEdges(planner, context, draft));

  const validation = validateCodexDraft(draft, kind);
  draft = {
    ...draft,
    meta: {
      ...draft.meta,
      validationErrors: validation.errors,
      phase: validation.valid ? "ready" : "generating",
    },
  };

  return {
    draft,
    parts: buildParts(draft, planner.summary),
  };
}
