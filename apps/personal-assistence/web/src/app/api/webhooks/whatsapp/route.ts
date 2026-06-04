import { NextResponse } from "next/server";

import {
  handleIncomingWhatsAppMessage,
  sendWhatsAppErrorReply,
} from "@/lib/whatsapp/handle-message";
import { WHATSAPP_ERRORS } from "@/lib/whatsapp/errors";
import {
  isEvolutionWebhookAuthorized,
  isUnsupportedMediaType,
  normalizePhone,
  parseEvolutionWebhook,
} from "@/lib/whatsapp/parse-webhook";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;

  if (!isEvolutionWebhookAuthorized(request, body)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = parseEvolutionWebhook(body);

  if (messages.length === 0) {
    const data = body.data as { messageType?: string; key?: { remoteJid?: string; fromMe?: boolean } } | undefined;
    const messageType = data?.messageType ?? "";
    const remoteJid = data?.key?.remoteJid;
    const fromMe = data?.key?.fromMe ?? false;

    if (
      remoteJid &&
      !fromMe &&
      isUnsupportedMediaType(messageType)
    ) {
      const phone = normalizePhone(remoteJid);
      if (phone) {
        await sendWhatsAppErrorReply(phone, WHATSAPP_ERRORS.unsupportedMedia);
      }
    }

    return NextResponse.json({ ok: true, skipped: true });
  }

  const results = [];

  for (const message of messages) {
    try {
      const result = await handleIncomingWhatsAppMessage(message, body);
      results.push({ messageId: message.messageId, ...result });
    } catch (error) {
      console.error("[webhook] failed to process message:", error);
      await sendWhatsAppErrorReply(
        message.phone,
        WHATSAPP_ERRORS.generic,
        message.replyRemoteJid,
      );
      results.push({
        messageId: message.messageId,
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
