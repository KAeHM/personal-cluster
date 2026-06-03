import { aiDebug } from "@/lib/ai/debug-log";
import {
  assertDecryptedAudioBuffer,
  AudioValidationError,
  isEncryptedWhatsAppMediaUrl,
  normalizeBase64Payload,
} from "@/lib/ai/validate-audio";
import {
  fetchEvolutionMediaBase64,
  type EvolutionMessageKey,
} from "@/lib/whatsapp/evolution-client";

export type AgentAudioInput = {
  base64?: string;
  url?: string;
  mimetype?: string;
  messageKey?: EvolutionMessageKey;
};

export { AudioValidationError };
export type { EvolutionMessageKey };

export function summarizeAudioLoadFailure(input: AgentAudioInput): string {
  if (input.base64) return "base64 inválido ou áudio corrompido";
  if (input.messageKey) return "falha ao buscar base64 via Evolution API";
  if (input.url && isEncryptedWhatsAppMediaUrl(input.url)) {
    return "webhook sem base64 — URL .enc do WhatsApp não pode ser usada diretamente";
  }
  return "áudio indisponível";
}

async function downloadAudio(url: string): Promise<Buffer> {
  if (isEncryptedWhatsAppMediaUrl(url)) {
    aiDebug("audio:download:blocked-enc", { url });
    throw new AudioValidationError(
      "URL de mídia criptografada (.enc) — use webhookBase64 ou getBase64FromMediaMessage",
    );
  }

  aiDebug("audio:download:start", { url });

  const response = await fetch(url);

  if (!response.ok) {
    aiDebug("audio:download:failed", {
      url,
      status: response.status,
      statusText: response.statusText,
    });
    throw new AudioValidationError(`Falha ao baixar áudio (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  aiDebug("audio:download:ok", {
    url,
    byteLength: buffer.byteLength,
  });

  return buffer;
}

export async function loadAudioBuffer(
  input: AgentAudioInput,
): Promise<{ buffer: Buffer; mimetype: string }> {
  let mimetype = input.mimetype ?? "audio/ogg";
  let buffer: Buffer;
  let source: "base64" | "evolution-api" | "url";

  if (input.base64) {
    source = "base64";
    buffer = Buffer.from(normalizeBase64Payload(input.base64), "base64");
  } else if (input.messageKey) {
    source = "evolution-api";
    try {
      const fetched = await fetchEvolutionMediaBase64(input.messageKey);
      buffer = Buffer.from(fetched.base64, "base64");
      if (fetched.mimetype) {
        mimetype = fetched.mimetype;
      }
    } catch (error) {
      aiDebug("audio:evolution-api:failed", {
        messageKey: input.messageKey,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AudioValidationError(
        error instanceof Error
          ? error.message
          : "Falha ao obter áudio decodificado da Evolution API",
      );
    }
  } else if (input.url) {
    source = "url";
    buffer = await downloadAudio(input.url);
  } else {
    aiDebug("audio:load:missing-content", {
      mimetype,
      input: { hasBase64: false, hasUrl: false, hasMessageKey: false },
    });
    throw new AudioValidationError("Áudio sem conteúdo disponível");
  }

  if (buffer.byteLength === 0) {
    aiDebug("audio:load:empty-buffer", { source, mimetype });
    throw new AudioValidationError("Áudio vazio");
  }

  assertDecryptedAudioBuffer(buffer);

  aiDebug("audio:load:ok", {
    source,
    mimetype,
    byteLength: buffer.byteLength,
    url: input.url ?? null,
    base64Length: input.base64?.length ?? 0,
    messageKey: input.messageKey ?? null,
    magic: buffer.subarray(0, 4).toString("hex"),
  });

  return { buffer, mimetype };
}
