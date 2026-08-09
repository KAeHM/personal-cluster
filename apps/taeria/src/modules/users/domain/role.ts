/**
 * Roles de usuario no dominio (agnosticas de banco/UI). O enum `user_role` no
 * Postgres espelha estes valores; os guards de auth consomem como role na sessao.
 */
export const USER_ROLES = ["admin", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRole = "user";
