import type { AuthSession, AuthUser } from "./session";

/**
 * Contrato mínimo que todo provider de auth precisa cumprir.
 * Capacidades específicas (password, oauth redirect, magic link)
 * devem ser modeladas como interfaces opcionais separadas, nunca
 * forçadas aqui, para não virar o "maior denominador comum".
 */
export interface AuthProviderPort {
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<AuthUser | null>;
  signOut(): Promise<void>;
}
