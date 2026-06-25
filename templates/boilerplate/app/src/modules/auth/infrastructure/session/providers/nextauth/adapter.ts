import type { Session } from "next-auth";
import type { AuthProviderPort } from "../../../../domain/session/auth-provider.port";
import type { AuthSession, AuthUser } from "../../../../domain/session/session";
import { auth, signOut } from "./index";

function toAuthUser(user: Session["user"]): AuthUser {
  return {
    id: user.id,
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    roles: user.role ? [user.role] : [],
  };
}

/**
 * Adapter que satisfaz a `AuthProviderPort` envolvendo o `auth()` do NextAuth.
 * Mapeia o usuário/sessão do SDK para os tipos de `domain` (não vaza tipos do
 * NextAuth para cima).
 */
export function createNextAuthProvider(): AuthProviderPort {
  return {
    async getSession(): Promise<AuthSession | null> {
      const session = await auth();
      if (!session?.user) {
        return null;
      }
      return {
        user: toAuthUser(session.user),
        expiresAt: session.expires ? Date.parse(session.expires) : undefined,
      };
    },

    async getCurrentUser(): Promise<AuthUser | null> {
      const session = await auth();
      return session?.user ? toAuthUser(session.user) : null;
    },

    async signOut(): Promise<void> {
      await signOut();
    },
  };
}
