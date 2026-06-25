import type { UserRepository } from "../domain/user.repository";
import { createDrizzleUserRepository } from "./adapters/drizzle/user.repository";

/**
 * Seam de seleção do repositório de usuários. A main usa a impl Drizzle; trocar
 * de tool é implementar outro adapter em `adapters/<tool>` e retorná-lo aqui.
 * A port (`UserRepository`) mantém application/domain desacoplados do banco.
 */
let cached: UserRepository | null = null;

export async function getUserRepository(): Promise<UserRepository> {
  if (!cached) {
    cached = createDrizzleUserRepository();
  }
  return cached;
}
