import { AUTH_ERRORS } from "../../domain/errors";
import type { AuthSession } from "../../domain/session/session";
import { getSession } from "./facade";

/**
 * Guards permanecem desacoplados do roteamento: lançam erro em vez de
 * redirecionar. Cada projeto decide como mapear (ex.: `redirect("/login")`)
 * na camada de presentation.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw AUTH_ERRORS.create("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(role: string): Promise<AuthSession> {
  const session = await requireAuth();
  if (!session.user.roles?.includes(role)) {
    throw AUTH_ERRORS.create("FORBIDDEN", { meta: { role } });
  }
  return session;
}
