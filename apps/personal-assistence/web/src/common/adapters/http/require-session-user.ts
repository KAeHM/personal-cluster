import { auth } from "@/auth";
import { COMMON_ERRORS } from "@/common/errors";
import { getDbUserFromSession } from "@/lib/auth/get-db-user";
import type { users } from "@/lib/db/schema";

type DbUser = typeof users.$inferSelect;

export async function requireSessionUser(): Promise<DbUser> {
  const session = await auth();

  if (!session?.user) {
    throw COMMON_ERRORS.create("UNAUTHORIZED");
  }

  const user = await getDbUserFromSession(session);

  if (!user) {
    throw COMMON_ERRORS.create("NOT_FOUND", {
      messageOverride: "Usuário não encontrado.",
    });
  }

  return user;
}
