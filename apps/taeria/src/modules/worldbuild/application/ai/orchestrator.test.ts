import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyCodexDraft } from "../../domain/codex-draft";
import type { Kind } from "../../domain/kind";

vi.mock("../../infrastructure/ai/gemini.client", () => ({
  isGeminiConfigured: vi.fn(() => true),
}));

vi.mock("../../infrastructure/kind.repository.factory", () => ({
  getKindRepository: vi.fn(),
}));

vi.mock("./agents/planner.agent", () => ({
  runPlannerAgent: vi.fn(),
  fallbackPlanner: vi.fn(),
}));

vi.mock("./agents/context.agent", () => ({
  runContextAgent: vi.fn(),
  buildFallbackContext: vi.fn(),
}));

vi.mock("./agents/facet.agents", () => ({
  runLoreAgent: vi.fn(),
  runSystemAgent: vi.fn(),
  runLexiconAgent: vi.fn(),
}));

import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import { isGeminiConfigured } from "../../infrastructure/ai/gemini.client";
import { fallbackPlanner, runPlannerAgent } from "./agents/planner.agent";
import { buildFallbackContext, runContextAgent } from "./agents/context.agent";
import { runLoreAgent } from "./agents/facet.agents";
import { orchestrateStudioTurn } from "./orchestrator";

const weaponKind: Kind = {
  id: "k1",
  slug: "weapon",
  name: "Arma",
  description: null,
  aiPrompt: null,
  isBuiltin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  facets: [
    {
      id: "f1",
      kindId: "k1",
      facetType: "lore",
      enabled: true,
      required: true,
      schema: {
        type: "object",
        properties: {
          lore_md: { type: "string", format: "markdown" },
        },
        required: ["lore_md"],
      },
      aiPrompt: null,
      displayOrder: 0,
    },
    {
      id: "f2",
      kindId: "k1",
      facetType: "system",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 1,
    },
    {
      id: "f3",
      kindId: "k1",
      facetType: "lexicon",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 2,
    },
    {
      id: "f4",
      kindId: "k1",
      facetType: "visual",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 3,
    },
    {
      id: "f5",
      kindId: "k1",
      facetType: "edges",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 4,
    },
    {
      id: "f6",
      kindId: "k1",
      facetType: "embeddings",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 5,
    },
  ],
};

const kindRepo = {
  list: vi.fn(),
  findBySlug: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isGeminiConfigured).mockReturnValue(true);
  vi.mocked(getKindRepository).mockResolvedValue(kindRepo as never);
  kindRepo.list.mockResolvedValue([weaponKind]);
  kindRepo.findBySlug.mockResolvedValue(weaponKind);
  vi.mocked(runPlannerAgent).mockRejectedValue(new Error("use fallback"));
  vi.mocked(runContextAgent).mockRejectedValue(new Error("use fallback"));
});

describe("orchestrateStudioTurn", () => {
  it("retorna decisão quando kind não está definido", async () => {
    vi.mocked(fallbackPlanner).mockReturnValue({
      intent: "clarify",
      kindSlug: null,
      title: null,
      slug: null,
      slots: {},
      agentsToRun: [],
      summary: "Qual tipo?",
    });

    const draft = createEmptyCodexDraft("session-1");
    const result = await orchestrateStudioTurn({
      draft,
      message: "quero criar algo",
    });

    expect(result.parts.some((part) => part.type === "decision")).toBe(true);
  });

  it("gera faceta lore e marca draft como ready", async () => {
    vi.mocked(fallbackPlanner).mockReturnValue({
      intent: "create",
      kindSlug: "weapon",
      title: "Espada de Valdris",
      slug: "espada-de-valdris",
      slots: {},
      agentsToRun: ["lore"],
      summary: "Arma lendária criada.",
    });

    vi.mocked(buildFallbackContext).mockReturnValue({
      kind: weaponKind,
      userIntent: "arma lendária",
      resolvedRefs: [],
      styleNotes: [],
      systemRules: [],
      constraints: [],
    });

    vi.mocked(runLoreAgent).mockResolvedValue({
      facetType: "lore",
      data: { lore_md: "Uma lâmina forjada no norte." },
    });

    const draft = createEmptyCodexDraft("session-1");
    const result = await orchestrateStudioTurn({
      draft,
      message: "espada lendária",
    });

    expect(result.draft.facets.lore?.lore_md).toContain("lâmina");
    expect(result.draft.meta.phase).toBe("ready");
    expect(result.parts.some((part) => part.type === "facet_editor")).toBe(
      true,
    );
  });

  it("falha quando Gemini não está configurado", async () => {
    vi.mocked(isGeminiConfigured).mockReturnValue(false);

    await expect(
      orchestrateStudioTurn({
        draft: createEmptyCodexDraft("s1"),
        message: "teste",
      }),
    ).rejects.toMatchObject({ code: "STUDIO_AI_UNAVAILABLE" });
  });

  it("pula faceta editada manualmente", async () => {
    vi.mocked(fallbackPlanner).mockReturnValue({
      intent: "create",
      kindSlug: "weapon",
      title: "Espada de Valdris",
      slug: "espada-de-valdris",
      slots: {},
      agentsToRun: ["lore"],
      summary: "Arma.",
    });

    vi.mocked(buildFallbackContext).mockReturnValue({
      kind: weaponKind,
      userIntent: "arma",
      resolvedRefs: [],
      styleNotes: [],
      systemRules: [],
      constraints: [],
    });

    const draft = createEmptyCodexDraft("session-1");
    draft.meta.userEdited.lore = true;
    draft.facets.lore = { lore_md: "Texto manual." };

    const result = await orchestrateStudioTurn({
      draft,
      message: "continuar",
    });

    expect(runLoreAgent).not.toHaveBeenCalled();
    expect(result.draft.facets.lore?.lore_md).toBe("Texto manual.");
  });

  it("preserva faceta visual após geração de lore", async () => {
    vi.mocked(fallbackPlanner).mockReturnValue({
      intent: "create",
      kindSlug: "weapon",
      title: "Espada de Valdris",
      slug: "espada-de-valdris",
      slots: {},
      agentsToRun: ["lore"],
      summary: "Arma.",
    });

    vi.mocked(buildFallbackContext).mockReturnValue({
      kind: weaponKind,
      userIntent: "arma",
      resolvedRefs: [],
      styleNotes: [],
      systemRules: [],
      constraints: [],
    });

    vi.mocked(runLoreAgent).mockResolvedValue({
      facetType: "lore",
      data: { lore_md: "Lore gerada pela IA." },
    });

    const draft = createEmptyCodexDraft("session-1");
    draft.facets.visual = {
      banner_url: "https://example.com/manual-banner.jpg",
    };

    const result = await orchestrateStudioTurn({
      draft,
      message: "continuar",
    });

    expect(result.draft.facets.visual?.banner_url).toBe(
      "https://example.com/manual-banner.jpg",
    );
  });
});
