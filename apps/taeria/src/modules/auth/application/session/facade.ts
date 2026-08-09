import type { AuthSession, AuthUser } from "../../domain/session/session";
import { getAuthProvider } from "../../infrastructure/session/factory";

export function getSession(): Promise<AuthSession | null> {
  return getAuthProvider().getSession();
}

export function getCurrentUser(): Promise<AuthUser | null> {
  return getAuthProvider().getCurrentUser();
}

export function signOut(): Promise<void> {
  return getAuthProvider().signOut();
}
