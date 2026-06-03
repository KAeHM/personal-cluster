import { shouldProcessIncomingMessage } from "@/lib/whatsapp/self-test";
import { aiDebug } from "@/lib/ai/debug-log";
import { normalizeBase64Payload } from "@/lib/ai/validate-audio";

export type IncomingAudio = {
  base64?: string;
  url?: string;
  mimetype?: string;
};

export type IncomingMessage = {
  messageId: string;
  phone: string;
  remoteJid: string;
  text: string;
  pushName?: string;
  timestamp: Date;
  isFromMe: boolean;
  messageType: string;
  audio?: IncomingAudio;
};

type EvolutionWebhookPayload = {
  event?: string;
  instance?: string;
  apikey?: string;
  data?: unknown;
};

type EvolutionMessageData = {
  key?: {
    id?: string;
    remoteJid?: string;
    fromMe?: boolean;
  };
  pushName?: string;
  message?: Record<string, unknown>;
  messageType?: string;
  messageTimestamp?: number | string;
  base64?: string;
};

const SUPPORTED_TEXT_TYPES = new Set([
  "conversation",
  "extendedTextMessage",
  "ephemeralMessage",
]);

const SUPPORTED_AUDIO_TYPES = new Set(["audioMessage"]);

export function normalizePhone(remoteJid: string): string {
  const withoutSuffix = remoteJid.split("@")[0] ?? remoteJid;
  return withoutSuffix.replace(/\D/g, "");
}

const MAX_PHONE_DIGITS = 13;

export function resolveEvolutionRecipient(
  remoteJid: string,
  phone: string,
): string {
  if (remoteJid.includes("@lid")) {
    return remoteJid;
  }

  if (phone.length > MAX_PHONE_DIGITS) {
    return `${phone}@lid`;
  }

  return phone;
}

function extractText(message?: Record<string, unknown>): string | null {
  if (!message) return null;

  if (typeof message.conversation === "string") {
    return message.conversation.trim();
  }

  const extended = message.extendedTextMessage as
    | { text?: string }
    | undefined;
  if (extended?.text) {
    return extended.text.trim();
  }

  const ephemeral = message.ephemeralMessage as
    | { message?: Record<string, unknown> }
    | undefined;
  if (ephemeral?.message) {
    return extractText(ephemeral.message);
  }

  return null;
}

function extractAudio(
  data: EvolutionMessageData,
): IncomingAudio | null {
  const message = data.message;
  if (!message) return null;

  const audioMessage = message.audioMessage as
    | {
        url?: string;
        mimetype?: string;
        base64?: string;
      }
    | undefined;

  const base64Raw =
    (typeof message.base64 === "string" ? message.base64 : undefined) ??
    (typeof data.base64 === "string" ? data.base64 : undefined) ??
    audioMessage?.base64;

  let base64: string | undefined;
  if (typeof base64Raw === "string" && base64Raw.trim()) {
    try {
      base64 = normalizeBase64Payload(base64Raw);
    } catch {
      base64 = base64Raw.trim();
    }
  }

  const url = audioMessage?.url;
  const mimetype = audioMessage?.mimetype ?? "audio/ogg; codecs=opus";

  if (!base64 && !url) return null;

  aiDebug("webhook:extract-audio", {
    hasBase64: Boolean(base64),
    base64Length: base64?.length ?? 0,
    hasUrl: Boolean(url),
    url: url ?? null,
    mimetype,
    sources: {
      messageBase64: typeof message.base64 === "string",
      dataBase64: typeof data.base64 === "string",
      audioMessageBase64: Boolean(audioMessage?.base64),
    },
  });

  return { base64, url, mimetype };
}

function parseMessageData(data: EvolutionMessageData): IncomingMessage | null {
  const remoteJid = data.key?.remoteJid;
  const messageId = data.key?.id;

  if (!remoteJid || !messageId) return null;

  const isFromMe = data.key?.fromMe ?? false;
  const messageType = data.messageType ?? "unknown";
  const text = extractText(data.message) ?? "";
  const audio = extractAudio(data);

  const isText = SUPPORTED_TEXT_TYPES.has(messageType) && text.length > 0;
  const isAudio = SUPPORTED_AUDIO_TYPES.has(messageType) && !!audio;

  if (!isText && !isAudio) return null;

  const timestampValue = data.messageTimestamp;
  const timestamp =
    typeof timestampValue === "number"
      ? new Date(timestampValue * 1000)
      : typeof timestampValue === "string"
        ? new Date(Number(timestampValue) * 1000)
        : new Date();

  return {
    messageId,
    phone: normalizePhone(remoteJid),
    remoteJid,
    text,
    pushName: data.pushName,
    timestamp,
    isFromMe,
    messageType,
    audio: isAudio ? audio ?? undefined : undefined,
  };
}

export function parseEvolutionWebhook(
  payload: EvolutionWebhookPayload,
): IncomingMessage[] {
  const event = payload.event?.toLowerCase();

  if (event && event !== "messages.upsert") {
    return [];
  }

  const rawData = payload.data;

  if (!rawData) return [];

  const items = Array.isArray(rawData) ? rawData : [rawData];

  return items
    .map((item) => parseMessageData(item as EvolutionMessageData))
    .filter((message): message is IncomingMessage => message !== null)
    .filter((message) => shouldProcessIncomingMessage(message));
}

export function isEvolutionWebhookAuthorized(
  request: Request,
  payload: EvolutionWebhookPayload,
): boolean {
  const expectedKey = process.env.EVOLUTION_API_KEY;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!expectedKey && !webhookSecret) {
    return process.env.NODE_ENV === "development";
  }

  const headerApiKey = request.headers.get("apikey");
  const headerSecret = request.headers.get("x-webhook-secret");

  if (webhookSecret && headerSecret === webhookSecret) {
    return true;
  }

  if (expectedKey) {
    return headerApiKey === expectedKey || payload.apikey === expectedKey;
  }

  return false;
}

export function isUnsupportedMediaType(messageType: string): boolean {
  return (
    !SUPPORTED_TEXT_TYPES.has(messageType) &&
    !SUPPORTED_AUDIO_TYPES.has(messageType)
  );
}
