import { eq } from "drizzle-orm";
import type { Session } from "next-auth";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { User } from "@/lib/db/schema";

/**
 * Resolve o usuário do banco pelo e-mail da sessão (fonte de verdade).
 * Evita JWT com id desatualizado após reset do banco ou recriação de conta.
 */
export async function getDbUserFromSession(
  session?: Session | null,
): Promise<User | null> {
  const resolvedSession = session ?? (await auth());
  if (!resolvedSession?.user) return null;

  const email = resolvedSession.user.email?.trim().toLowerCase();
  if (email) {
    const byEmail = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (byEmail) return byEmail;
  }

  if (resolvedSession.user.id) {
    const byId = await db.query.users.findFirst({
      where: eq(users.id, resolvedSession.user.id),
    });
    return byId ?? null;
  }

  return null;
}

export function hasCompletedOnboarding(
  user: Pick<User, "onboardingCompletedAt">,
): boolean {
  return user.onboardingCompletedAt != null;
}
