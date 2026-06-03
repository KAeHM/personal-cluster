import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { messageLogs, tasks, users } from "@/lib/db/schema";
import { normalizePhone } from "@/lib/whatsapp/parse-webhook";
import { isUniqueViolation } from "@/lib/whatsapp/errors";

export async function claimInboundMessage(messageId: string): Promise<boolean> {
  try {
    await db.insert(messageLogs).values({
      direction: "in",
      externalMessageId: messageId,
      content: null,
      rawPayload: { messageId, status: "processing" },
    });
    return true;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return false;
    }
    throw error;
  }
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
}) {
  await db
    .update(messageLogs)
    .set({
      userId,
      content,
      rawPayload: { messageId, payload: rawPayload },
    })
    .where(eq(messageLogs.externalMessageId, messageId));
}

export async function logOutboundMessage({
  userId,
  content,
  phone,
}: {
  userId: string;
  content: string;
  phone: string;
}) {
  await db.insert(messageLogs).values({
    userId,
    direction: "out",
    content,
    rawPayload: { phone },
  });
}

export async function linkPhoneToUser(
  userId: string,
  rawPhone: string,
): Promise<{ phone: string; merged: boolean }> {
  const phone = normalizePhone(rawPhone);

  if (phone.length < 10) {
    throw new Error("Telefone inválido. Use o formato com DDD e país (ex: 5511999999999).");
  }

  const emailUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!emailUser) {
    throw new Error("Usuário não encontrado");
  }

  if (emailUser.phone === phone) {
    return { phone, merged: false };
  }

  if (emailUser.phone && emailUser.phone !== phone) {
    throw new Error("Sua conta já possui outro telefone vinculado.");
  }

  const phoneUser = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  });

  if (!phoneUser || phoneUser.id === emailUser.id) {
    await db
      .update(users)
      .set({ phone })
      .where(eq(users.id, emailUser.id));

    return { phone, merged: false };
  }

  if (phoneUser.email) {
    throw new Error("Este telefone já está vinculado a outra conta.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ userId: emailUser.id })
      .where(eq(tasks.userId, phoneUser.id));

    await tx
      .update(messageLogs)
      .set({ userId: emailUser.id })
      .where(eq(messageLogs.userId, phoneUser.id));

    await tx
      .update(users)
      .set({
        phone,
        name: emailUser.name ?? phoneUser.name,
      })
      .where(eq(users.id, emailUser.id));

    await tx.delete(users).where(eq(users.id, phoneUser.id));
  });

  return { phone, merged: true };
}
