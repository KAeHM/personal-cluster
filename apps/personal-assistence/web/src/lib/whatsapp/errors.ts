export function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  while (typeof current === "object" && current !== null) {
    if ("code" in current && (current as { code: string }).code === "23505") {
      return true;
    }

    current =
      "cause" in current
        ? (current as { cause: unknown }).cause
        : undefined;
  }

  return false;
}

export function mapAgentError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Desculpe, ocorreu um erro inesperado. Tente novamente.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("google_generative_ai_api_key")) {
    return "O serviço de IA não está configurado no momento. Tente mais tarde.";
  }

  if (message.includes("rate limit") || message.includes("429")) {
    return "Estou recebendo muitas mensagens agora. Aguarde um instante e tente de novo.";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "Demorei demais para responder. Pode repetir sua mensagem?";
  }

  if (message.includes("usuário não encontrado")) {
    return "Não encontrei seu cadastro. Tente enviar a mensagem novamente.";
  }

  return "Não consegui processar sua solicitação agora. Reformule ou tente em instantes.";
}

export const WHATSAPP_ERRORS = {
  audioFailed:
    "Não consegui entender o áudio. Pode enviar por texto ou gravar novamente?",
  audioUndecrypted:
    "Não consegui decodificar o áudio. Confirme webhookBase64 na Evolution ou envie por texto.",
  audioEmpty: "O áudio parece vazio. Envie novamente ou escreva a mensagem.",
  unsupportedMedia:
    "Por enquanto só entendo mensagens de texto e áudio. Escreva o que precisa registrar.",
  generic:
    "Desculpe, não consegui processar sua mensagem agora. Tente novamente em instantes.",
  sendFailed:
    "Processei sua solicitação, mas não consegui enviar a resposta. Tente de novo.",
} as const;
