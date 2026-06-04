export const WHATSAPP_ASSISTANT_PREFIX = "[Assistente]\n";

export function isWhatsAppSelfTestMode(): boolean {
  return process.env.WHATSAPP_SELF_TEST_MODE === "true";
}

function normalizePhoneDigits(value: string): string {
  const withoutSuffix = value.split("@")[0] ?? value;
  return withoutSuffix.replace(/\D/g, "");
}

function getSelfPhoneDigits(): string | null {
  const selfPhone = process.env.WHATSAPP_SELF_PHONE?.trim();
  if (!selfPhone) return null;

  const digits = selfPhone.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function isSelfChatMessage(message: {
  isFromMe: boolean;
  remoteJid: string;
  replyRemoteJid: string;
}): boolean {
  if (!message.isFromMe) return false;

  const selfPhone = getSelfPhoneDigits();
  if (!selfPhone) return false;

  const remoteDigits = normalizePhoneDigits(message.remoteJid);
  if (remoteDigits === selfPhone) return true;

  if (message.remoteJid.includes("@lid")) {
    const replyDigits = normalizePhoneDigits(message.replyRemoteJid);
    if (replyDigits === selfPhone) return true;
  }

  return false;
}

export function isAssistantOutboundMessage(text: string): boolean {
  return text.startsWith(WHATSAPP_ASSISTANT_PREFIX);
}

export function formatAssistantOutboundMessage(text: string): string {
  if (!isWhatsAppSelfTestMode()) {
    return text;
  }

  if (isAssistantOutboundMessage(text)) {
    return text;
  }

  return `${WHATSAPP_ASSISTANT_PREFIX}${text}`;
}

export function shouldProcessIncomingMessage(message: {
  isFromMe: boolean;
  remoteJid: string;
  replyRemoteJid: string;
  text: string;
}): boolean {
  if (isAssistantOutboundMessage(message.text)) {
    return false;
  }

  if (isWhatsAppSelfTestMode()) {
    return isSelfChatMessage(message);
  }

  return !message.isFromMe;
}
