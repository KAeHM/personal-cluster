import type { UserRepository } from "../domain/user.repository";
import { createSupabaseUserRepository } from "./adapters/supabase/user.repository";

/**
 * Seam de seleção do repositório de usuários. A main usa Supabase; trocar
 * de tool é implementar outro adapter em `adapters/<tool>` e retorná-lo aqui.
 */
let cached: UserRepository | null = null;

export async function getUserRepository(): Promise<UserRepository> {
  if (!cached) {
    cached = createSupabaseUserRepository();
  }
  return cached;
}
