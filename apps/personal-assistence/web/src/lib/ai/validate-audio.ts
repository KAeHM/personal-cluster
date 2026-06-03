export class AudioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioValidationError";
  }
}

const OGG_MAGIC = Buffer.from("OggS");

export function normalizeBase64Payload(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex === -1) {
      throw new AudioValidationError("Base64 de áudio inválido");
    }
    return trimmed.slice(commaIndex + 1);
  }
  return trimmed;
}

export function isEncryptedWhatsAppMediaUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.includes(".enc") || pathname.endsWith("/enc");
  } catch {
    return url.toLowerCase().includes(".enc");
  }
}

export function assertDecryptedAudioBuffer(buffer: Buffer): void {
  if (buffer.byteLength < 4) {
    throw new AudioValidationError("Áudio inválido ou corrompido");
  }

  if (buffer.subarray(0, 4).equals(OGG_MAGIC)) {
    return;
  }

  // MP3 frame sync
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return;
  }

  // WebM / Matroska
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return;
  }

  throw new AudioValidationError(
    "Áudio não decodificado (provável mídia criptografada do WhatsApp)",
  );
}

const LISTING_HALLUCINATION_PATTERN =
  /\b(primeir[ao]|segund[ao]|terceir[ao])\s+tarefa\b/i;

export function assertPlausibleTranscription(
  transcription: string,
  audioByteLength: number,
): void {
  const text = transcription.trim();
  if (!text) {
    throw new AudioValidationError("Transcrição vazia");
  }

  const maxChars = Math.max(100, Math.ceil(audioByteLength / 1024) * 22);

  if (text.length > maxChars) {
    throw new AudioValidationError(
      `Transcrição longa demais para o tamanho do áudio (${text.length} chars, limite ~${maxChars})`,
    );
  }

  if (audioByteLength < 20_000 && LISTING_HALLUCINATION_PATTERN.test(text)) {
    throw new AudioValidationError(
      "Transcrição inconsistente com áudio curto (padrão de listagem detectado)",
    );
  }

  const clauseCount = text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12).length;

  if (audioByteLength < 20_000 && clauseCount >= 3) {
    throw new AudioValidationError(
      "Transcrição com frases demais para a duração provável do áudio",
    );
  }
}
