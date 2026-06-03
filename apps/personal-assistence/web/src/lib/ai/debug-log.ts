function isAiDebugEnabled(): boolean {
  return (
    process.env.AI_DEBUG === "true" ||
    process.env.NODE_ENV === "development"
  );
}

export function summarizeAudioInput(input?: {
  base64?: string;
  url?: string;
  mimetype?: string;
  messageKey?: { id: string; remoteJid: string; fromMe: boolean };
}): Record<string, unknown> {
  if (!input) {
    return { present: false };
  }

  return {
    present: true,
    mimetype: input.mimetype ?? null,
    hasBase64: Boolean(input.base64),
    base64Length: input.base64?.length ?? 0,
    hasUrl: Boolean(input.url),
    url: input.url ?? null,
    hasMessageKey: Boolean(input.messageKey),
    messageKey: input.messageKey ?? null,
  };
}

export function truncateText(value: string, max = 500): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}… (+${value.length - max} chars)`;
}

export function aiDebug(step: string, data: Record<string, unknown>): void {
  if (!isAiDebugEnabled()) return;

  console.log(`[ai:${step}]`, JSON.stringify(data, null, 2));
}
