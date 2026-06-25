import type { NewUser, UpdateUser, User } from "./user";

/**
 * Port do repositório de usuários: contrato em termos de domínio, sem
 * conhecer nenhum tool de banco. Cada adapter em `infrastructure/adapters/<tool>`
 * implementa esta interface.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(): Promise<User[]>;
  create(data: NewUser): Promise<User>;
  /** Retorna o usuário atualizado, ou `null` se o id não existir. */
  update(id: string, data: UpdateUser): Promise<User | null>;
  /** Retorna `true` se removeu, `false` se o id não existia. */
  delete(id: string): Promise<boolean>;
}
