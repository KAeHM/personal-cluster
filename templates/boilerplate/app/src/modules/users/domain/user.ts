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
}

export interface UpdateUser {
  name?: string | null;
  role?: UserRole;
}
