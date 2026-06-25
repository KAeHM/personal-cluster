export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  roles?: string[];
}

export interface AuthSession {
  user: AuthUser;
  expiresAt?: number;
}
