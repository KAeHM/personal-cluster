import type { CredentialsRepository } from "../../domain/credentials/credentials.repository";
import { createDrizzleCredentialsRepository } from "./adapters/drizzle/credentials.repository";

/**
 * Seam de seleção do repositório de credenciais. A main usa a impl Drizzle;
 * trocar de tool é implementar outro adapter em `adapters/<tool>` e retorná-lo
 * aqui. A port mantém application/domain desacoplados do banco.
 */
let cached: CredentialsRepository | null = null;

export async function getCredentialsRepository(): Promise<CredentialsRepository> {
  if (!cached) {
    cached = createDrizzleCredentialsRepository();
  }
  return cached;
}
