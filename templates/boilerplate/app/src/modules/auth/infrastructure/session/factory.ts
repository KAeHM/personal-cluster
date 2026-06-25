import type { AuthProviderPort } from "../../domain/session/auth-provider.port";
import { createNextAuthProvider } from "./providers/nextauth/adapter";

/**
 * Seam de seleção do provider de auth (sessão). A main usa NextAuth; trocar de
 * provider é implementar outro adapter em `providers/<provider>` que satisfaça
 * `AuthProviderPort` e retorná-lo aqui.
 */
let cached: AuthProviderPort | null = null;

export function getAuthProvider(): AuthProviderPort {
  if (!cached) {
    cached = createNextAuthProvider();
  }
  return cached;
}
