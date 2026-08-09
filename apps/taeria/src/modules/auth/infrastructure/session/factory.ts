import type { AuthProviderPort } from "../../domain/session/auth-provider.port";
import { createSupabaseAuthProvider } from "./providers/supabase/adapter";

/**
 * Seam de seleção do provider de auth (sessão). A main usa Supabase Auth;
 * trocar de provider é implementar outro adapter em `providers/<provider>`.
 */
let cached: AuthProviderPort | null = null;

export function getAuthProvider(): AuthProviderPort {
  cached ??= createSupabaseAuthProvider();
  return cached;
}
