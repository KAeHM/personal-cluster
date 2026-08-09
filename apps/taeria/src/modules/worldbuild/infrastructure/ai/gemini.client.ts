import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { CODEX_ERRORS } from "../../domain/errors";

export type GeminiTier = "fast" | "pro";

const DEFAULT_FAST_MODEL = "gemini-2.5-flash";
const DEFAULT_PRO_MODEL = "gemini-2.5-pro";
const DEFAULT_FAST_MAX_OUTPUT_TOKENS = 8_192;
const DEFAULT_PRO_MAX_OUTPUT_TOKENS = 16_384;
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

/** Deve casar com a coluna `codex_embedding.embedding vector(1536)`. */
export const GEMINI_EMBEDDING_DIMENSIONS = 1536;

function resolveModelId(tier: GeminiTier): string {
  const env = process.env;
  if (tier === "pro") {
    return env.GEMINI_MODEL_PRO ?? DEFAULT_PRO_MODEL;
  }
  return env.GEMINI_MODEL ?? DEFAULT_FAST_MODEL;
}

function getGoogleProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw CODEX_ERRORS.create("AI_UNAVAILABLE");
  }

  return createGoogleGenerativeAI({ apiKey });
}

export function getGeminiModel(tier: GeminiTier = "fast") {
  const provider = getGoogleProvider();
  return provider(resolveModelId(tier));
}

export function getGeminiEmbeddingModel() {
  const provider = getGoogleProvider();
  return provider.textEmbedding(
    process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL,
  );
}

export function getGeminiMaxOutputTokens(tier: GeminiTier = "fast"): number {
  const env = process.env;
  if (tier === "pro") {
    const parsed = Number(env.GEMINI_MAX_OUTPUT_TOKENS_PRO);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_PRO_MAX_OUTPUT_TOKENS;
  }

  const parsed = Number(env.GEMINI_MAX_OUTPUT_TOKENS);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_FAST_MAX_OUTPUT_TOKENS;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}
