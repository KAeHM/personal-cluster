import type { Credentials, NewCredentials } from "./credentials";

/**
 * Port do repositório de credenciais. Implementado por adapter de banco em
 * infrastructure/<tool>, reaproveitando os clients de common/adapters/db.
 */
export interface CredentialsRepository {
  findByEmail(email: string): Promise<Credentials | null>;
  findByUserId(userId: string): Promise<Credentials | null>;
  create(data: NewCredentials): Promise<Credentials>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
