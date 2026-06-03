import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { messageLogs } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/whatsapp/errors";

export type ClaimInboundResult = {
  claimed: boolean;
  messageLogId?: string;
};

export async function claimInboundMessage(
  messageId: string,
): Promise<ClaimInboundResult> {
  try {
    const [inserted] = await db
      .insert(messageLogs)
      .values({
        direction: "in",
        externalMessageId: messageId,
        content: null,
        rawPayload: { messageId, status: "processing" },
      })
      .returning({ id: messageLogs.id });

    return { claimed: true, messageLogId: inserted.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { claimed: false };
    }
    throw error;
  }
}

export async function getMessageLogIdByExternalId(
  messageId: string,
): Promise<string | null> {
  const row = await db.query.messageLogs.findFirst({
    where: eq(messageLogs.externalMessageId, messageId),
    columns: { id: true },
  });

  return row?.id ?? null;
}

export async function finalizeInboundMessage({
  messageId,
  userId,
  content,
  rawPayload,
}: {
  messageId: string;
  userId: string;
  content: string;
  rawPayload: unknown;
}): Promise<string> {
  const [updated] = await db
    .update(messageLogs)
    .set({
      userId,
      content,
      rawPayload: { messageId, payload: rawPayload },
    })
    .where(eq(messageLogs.externalMessageId, messageId))
    .returning({ id: messageLogs.id });

  if (updated) {
    return updated.id;
  }

  const existingId = await getMessageLogIdByExternalId(messageId);
  if (!existingId) {
    throw new Error(`message_log não encontrado para ${messageId}`);
  }

  return existingId;
}

export async function logOutboundMessage({
  userId,
  content,
  phone,
}: {
  userId: string;
  content: string;
  phone: string;
}): Promise<string> {
  const [inserted] = await db
    .insert(messageLogs)
    .values({
      userId,
      direction: "out",
      content,
      rawPayload: { phone },
    })
    .returning({ id: messageLogs.id });

  return inserted.id;
}
