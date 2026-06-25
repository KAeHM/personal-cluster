import type { AuthUser } from "../../domain/session/session";
import { getCredentialsRepository } from "../../infrastructure/credentials/factory";
import { passwordHasher } from "../../infrastructure/security/password-hasher";

/**
 * Use case provider-agnostic: valida email + senha contra o repositório de
 * credenciais. É o ponto de costura que qualquer provider de credentials
 * (ex.: o `authorize` do NextAuth) deve chamar — sem acoplar ao provider.
 *
 * Retorna o `AuthUser` mínimo (id + email); enriquecer com perfil/roles é
 * responsabilidade da camada que monta a sessão.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const repo = await getCredentialsRepository();
  const creds = await repo.findByEmail(email);
  if (!creds) {
    return null;
  }

  const valid = await passwordHasher.verify(password, creds.passwordHash);
  if (!valid) {
    return null;
  }

  return { id: creds.userId, email: creds.email };
}
