/**
 * Roles de usuario, definidas no dominio (agnosticas de banco/UI). O adapter
 * Drizzle espelha estes valores num pgEnum; os guards de auth consomem como
 * `roles` na sessao.
 */
export const USER_ROLES = ["admin", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_USER_ROLE: UserRole = "user";
