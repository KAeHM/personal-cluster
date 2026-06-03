import { google } from "@ai-sdk/google";

export const AGENT_MODEL_ID = "gemini-2.5-flash";

export function getAgentModel() {
  assertGoogleAiConfigured();
  return google(AGENT_MODEL_ID);
}

export function assertGoogleAiConfigured() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }
}
