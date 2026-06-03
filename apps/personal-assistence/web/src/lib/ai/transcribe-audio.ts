import { generateText } from "ai";

import {
  type AgentAudioInput,
  loadAudioBuffer,
} from "@/lib/ai/audio-input";
import { aiDebug, summarizeAudioInput, truncateText } from "@/lib/ai/debug-log";
import { getAgentModel } from "@/lib/ai/model";
import { assertPlausibleTranscription } from "@/lib/ai/validate-audio";

const TRANSCRIBE_PROMPT =
  "Transcreva literalmente, em português brasileiro, apenas o que foi falado neste áudio. " +
  "Se o áudio estiver ilegível, responda exatamente: [inaudível]. " +
  "Não invente frases, listas, exemplos ou comandos que não foram ditos.";

export async function transcribeAudio(
  input: AgentAudioInput,
): Promise<string> {
  aiDebug("transcribe:input", summarizeAudioInput(input));

  const { buffer, mimetype } = await loadAudioBuffer(input);

  aiDebug("transcribe:gemini-request", {
    mimetype,
    byteLength: buffer.byteLength,
  });

  const result = await generateText({
    model: getAgentModel(),
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: buffer,
            mediaType: mimetype,
          },
          {
            type: "text",
            text: TRANSCRIBE_PROMPT,
          },
        ],
      },
    ],
  });

  const transcription = result.text.trim();

  if (transcription === "[inaudível]" || transcription.toLowerCase() === "[inaudivel]") {
    throw new Error("Transcrição vazia");
  }

  assertPlausibleTranscription(transcription, buffer.byteLength);

  aiDebug("transcribe:output", {
    transcription: truncateText(transcription),
    length: transcription.length,
    byteLength: buffer.byteLength,
  });

  return transcription;
}
