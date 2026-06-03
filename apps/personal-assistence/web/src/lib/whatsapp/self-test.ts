export const WHATSAPP_ASSISTANT_PREFIX = "[Assistente]\n";

export function isWhatsAppSelfTestMode(): boolean {
  return process.env.WHATSAPP_SELF_TEST_MODE === "true";
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
  text: string;
}): boolean {
  if (isAssistantOutboundMessage(message.text)) {
    return false;
  }

  if (isWhatsAppSelfTestMode()) {
    return message.isFromMe;
  }

  return !message.isFromMe;
}
