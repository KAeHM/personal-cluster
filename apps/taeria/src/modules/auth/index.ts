export { AUTH_ERRORS } from "./domain/errors";
export type { AuthSession, AuthUser } from "./domain/session/session";
export type { AuthProviderPort } from "./domain/session/auth-provider.port";
export {
  getSession,
  getCurrentUser,
  signOut,
} from "./application/session/facade";
export { requireAuth, requireRole } from "./application/session/guards";
export {
  signInAction,
  signOutAction,
} from "./presentation/actions/auth.actions";
export type { SignInState } from "./presentation/actions/types";
