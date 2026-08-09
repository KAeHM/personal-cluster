import type { UserRole } from "./role";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  email: string;
  name?: string | null;
  role?: UserRole;
  /** Senha para criação no Supabase Auth; gerada automaticamente se omitida. */
  password?: string;
}

export interface UpdateUser {
  name?: string | null;
  role?: UserRole;
}
