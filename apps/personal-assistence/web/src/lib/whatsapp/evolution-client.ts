import { formatAssistantOutboundMessage } from "@/lib/whatsapp/self-test";
import { aiDebug } from "@/lib/ai/debug-log";
import { normalizeBase64Payload } from "@/lib/ai/validate-audio";
import { formatEvolutionSendNumber } from "@/lib/whatsapp/parse-webhook";

type SendTextInput = {
  phone: string;
  text: string;
};

export type EvolutionMessageKey = {
  id: string;
  remoteJid: string;
  fromMe: boolean;
};

function getEvolutionConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!baseUrl || !apiKey || !instance) {
    throw new Error(
      "EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE são obrigatórios",
    );
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, instance };
}

function parseEvolutionBase64Response(
  payload: unknown,
): { base64: string; mimetype?: string } {
  if (!payload || typeof payload !== "object") {
    throw new Error("Resposta inválida da Evolution API");
  }

  const candidates: Record<string, unknown>[] = [payload as Record<string, unknown>];

  const media = (payload as Record<string, unknown>).media;
  if (media && typeof media === "object") {
    candidates.push(media as Record<string, unknown>);
  }

  const data = (payload as Record<string, unknown>).data;
  if (data && typeof data === "object") {
    candidates.push(data as Record<string, unknown>);
  }

  for (const candidate of candidates) {
    if (typeof candidate.base64 === "string" && candidate.base64.trim()) {
      return {
        base64: candidate.base64,
        mimetype:
          typeof candidate.mimetype === "string" ? candidate.mimetype : undefined,
      };
    }
  }

  throw new Error("Evolution API não retornou base64");
}

export async function fetchEvolutionMediaBase64(
  messageKey: EvolutionMessageKey,
): Promise<{ base64: string; mimetype?: string }> {
  const { baseUrl, apiKey, instance } = getEvolutionConfig();

  aiDebug("evolution:getBase64:start", {
    instance,
    messageKey,
  });

  const response = await fetch(
    `${baseUrl}/chat/getBase64FromMediaMessage/${instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        message: { key: messageKey },
        convertToMp4: false,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    aiDebug("evolution:getBase64:failed", {
      status: response.status,
      body: body.slice(0, 500),
    });
    throw new Error(
      `Evolution getBase64FromMediaMessage failed (${response.status}): ${body}`,
    );
  }

  const payload: unknown = await response.json();
  const parsed = parseEvolutionBase64Response(payload);
  const base64 = normalizeBase64Payload(parsed.base64);

  aiDebug("evolution:getBase64:ok", {
    base64Length: base64.length,
    mimetype: parsed.mimetype ?? null,
  });

  return {
    base64,
    mimetype: parsed.mimetype,
  };
}

export async function sendWhatsAppText({
  phone,
  text,
}: SendTextInput): Promise<void> {
  const { baseUrl, apiKey, instance } = getEvolutionConfig();

  const response = await fetch(
    `${baseUrl}/message/sendText/${instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: formatEvolutionSendNumber(phone),
        text: formatAssistantOutboundMessage(text),
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Evolution API sendText failed (${response.status}): ${body}`,
    );
  }
}
