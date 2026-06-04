import { AudioValidationError } from "@/lib/ai/audio-input";
import { runAgent } from "@/lib/ai/agent";
import { aiDebug, summarizeAudioInput, truncateText } from "@/lib/ai/debug-log";
import { transcribeAudio } from "@/lib/ai/transcribe-audio";
import type { User } from "@/lib/db/schema";
import {
  extractAffectedTaskIdsFromToolCalls,
  mergeAffectedTaskIds,
} from "@/lib/tasks/extract-affected-task-ids";
import {
  filterTaskIdsOwnedByUser,
  linkTasksToMessage,
} from "@/lib/tasks/message-links";
import { getOrCreateUserByPhone } from "@/lib/tasks/queries";
import { tryHandlePendingGroupClarification } from "@/lib/whatsapp/pending-group-clarification";
import {
  tryHandleFinalizeIntent,
  tryHandlePendingFinishSelection,
} from "@/lib/whatsapp/finalize-task";
import { tryHandlePendingTaskDuplicate } from "@/lib/whatsapp/pending-task-duplicate";
import { sendWhatsAppText } from "@/lib/whatsapp/evolution-client";
import {
  mapAgentError,
  WHATSAPP_ERRORS,
} from "@/lib/whatsapp/errors";
import {
  claimInboundMessage,
  finalizeInboundMessage,
  logOutboundMessage,
} from "@/lib/whatsapp/message-logs";
import {
  type IncomingMessage,
} from "@/lib/whatsapp/parse-webhook";

const KNOWN_WHATSAPP_MESSAGES = new Set<string>(Object.values(WHATSAPP_ERRORS));

type ProcessTextResult = {
  reply: string;
  affectedTaskIds: string[];
};

async function resolveInboundText(message: IncomingMessage): Promise<{
  text: string;
  logContent: string;
}> {
  if (message.text.trim()) {
    const text = message.text.trim();
    aiDebug("whatsapp:inbound:text", {
      messageId: message.messageId,
      text: truncateText(text),
    });
    return { text, logContent: text };
  }

  if (!message.audio) {
    throw new Error(WHATSAPP_ERRORS.unsupportedMedia);
  }

  aiDebug("whatsapp:inbound:audio", {
    messageId: message.messageId,
    messageType: message.messageType,
    audio: summarizeAudioInput(message.audio),
    note: "Sem base64 no webhook → fallback getBase64FromMediaMessage na Evolution",
  });

  try {
    const transcription = await transcribeAudio({
      ...message.audio,
      messageKey: {
        id: message.messageId,
        remoteJid: message.remoteJid,
        fromMe: message.isFromMe,
      },
    });
    if (!transcription) {
      throw new Error(WHATSAPP_ERRORS.audioEmpty);
    }

    return {
      text: transcription,
      logContent: `[transcription] ${transcription}`,
    };
  } catch (error) {
    console.error("[whatsapp] transcription error:", error);
    aiDebug("whatsapp:transcribe:error", {
      messageId: message.messageId,
      audio: summarizeAudioInput(message.audio),
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof AudioValidationError) {
      const undecrypted =
        error.message.includes("criptografada") ||
        error.message.includes(".enc") ||
        error.message.includes("webhookBase64") ||
        error.message.includes("getBase64FromMediaMessage") ||
        error.message.includes("Evolution") ||
        error.message.includes("não decodificado");
      throw new Error(
        undecrypted
          ? WHATSAPP_ERRORS.audioUndecrypted
          : WHATSAPP_ERRORS.audioFailed,
      );
    }

    throw new Error(WHATSAPP_ERRORS.audioFailed);
  }
}

async function replyToUser(
  message: IncomingMessage,
  userId: string,
  text: string,
): Promise<string> {
  const recipient = message.replyRemoteJid;
  await sendWhatsAppText({ phone: recipient, text });
  return logOutboundMessage({ userId, content: text, phone: message.phone });
}

async function processTextMessage(
  user: User,
  text: string,
  whatsappPushName?: string | null,
): Promise<ProcessTextResult> {
  const duplicateResult = await tryHandlePendingTaskDuplicate(
    user,
    text,
    whatsappPushName,
  );

  if (duplicateResult.handled) {
    aiDebug("whatsapp:handler:duplicate", { text: truncateText(text) });
    return {
      reply: duplicateResult.reply,
      affectedTaskIds: duplicateResult.affectedTaskIds ?? [],
    };
  }

  const finishPendingResult = await tryHandlePendingFinishSelection(
    user,
    text,
    whatsappPushName,
  );

  if (finishPendingResult.handled) {
    aiDebug("whatsapp:handler:finish-selection", { text: truncateText(text) });
    return {
      reply: finishPendingResult.reply,
      affectedTaskIds: finishPendingResult.affectedTaskIds ?? [],
    };
  }

  const finalizeResult = await tryHandleFinalizeIntent(
    user,
    text,
    whatsappPushName,
  );

  if (finalizeResult.handled) {
    aiDebug("whatsapp:handler:finalize", { text: truncateText(text) });
    return {
      reply: finalizeResult.reply,
      affectedTaskIds: finalizeResult.affectedTaskIds ?? [],
    };
  }

  const pendingResult = await tryHandlePendingGroupClarification(
    user,
    text,
    whatsappPushName,
  );

  if (pendingResult.handled) {
    aiDebug("whatsapp:handler:group-clarification", { text: truncateText(text) });
    return {
      reply: pendingResult.reply,
      affectedTaskIds: pendingResult.affectedTaskIds ?? [],
    };
  }

  aiDebug("whatsapp:agent:start", {
    userId: user.id,
    message: truncateText(text),
    note: "Agente recebe só texto (transcrição se veio de áudio) — não recebe file/url de áudio",
  });

  const result = await runAgent({
    userId: user.id,
    message: text,
    sourceUtterance: text,
    whatsappPushName,
  });

  aiDebug("whatsapp:agent:reply", {
    userId: user.id,
    reply: truncateText(result.reply),
    toolCalls: result.toolCalls.map((call) => ({
      toolName: call.toolName,
      input: call.input,
    })),
    steps: result.steps,
  });

  return {
    reply: result.reply.trim() || WHATSAPP_ERRORS.generic,
    affectedTaskIds: extractAffectedTaskIdsFromToolCalls(result.toolCalls),
  };
}

async function linkMessageTasks(
  userId: string,
  messageLogId: string,
  taskIds: string[],
): Promise<void> {
  const ownedTaskIds = await filterTaskIdsOwnedByUser(userId, taskIds);
  if (ownedTaskIds.length === 0) return;

  await linkTasksToMessage(messageLogId, ownedTaskIds);
}

export async function handleIncomingWhatsAppMessage(
  message: IncomingMessage,
  rawPayload: unknown,
): Promise<{ processed: boolean; reply?: string; duplicate?: boolean }> {
  const claim = await claimInboundMessage(message.messageId);
  if (!claim.claimed) {
    return { processed: false, duplicate: true };
  }

  const user = await getOrCreateUserByPhone(message.phone, message.pushName);

  let reply: string;
  let affectedTaskIds: string[] = [];
  let inboundLogId: string | undefined = claim.messageLogId;

  try {
    const { text, logContent } = await resolveInboundText(message);

    inboundLogId = await finalizeInboundMessage({
      messageId: message.messageId,
      userId: user.id,
      content: logContent,
      rawPayload,
    });

    const processed = await processTextMessage(user, text, message.pushName);
    reply = processed.reply;
    affectedTaskIds = processed.affectedTaskIds;
  } catch (error) {
    console.error("[whatsapp] processing error:", error);
    reply =
      error instanceof Error && KNOWN_WHATSAPP_MESSAGES.has(error.message)
        ? error.message
        : mapAgentError(error);

    inboundLogId = await finalizeInboundMessage({
      messageId: message.messageId,
      userId: user.id,
      content: `[error] ${reply}`,
      rawPayload,
    });
  }

  if (inboundLogId && affectedTaskIds.length > 0) {
    await linkMessageTasks(user.id, inboundLogId, affectedTaskIds);
  }

  try {
    const outboundLogId = await replyToUser(message, user.id, reply);

    if (affectedTaskIds.length > 0) {
      await linkMessageTasks(user.id, outboundLogId, affectedTaskIds);
    }
  } catch (error) {
    console.error("[whatsapp] send error:", error);
    throw error;
  }

  return { processed: true, reply };
}

export async function sendWhatsAppErrorReply(
  phone: string,
  text: string = WHATSAPP_ERRORS.generic,
  replyRemoteJid?: string,
) {
  try {
    const recipient = replyRemoteJid ?? phone;
    await sendWhatsAppText({ phone: recipient, text });
  } catch (error) {
    console.error("[whatsapp] failed to send error reply:", error);
  }
}
