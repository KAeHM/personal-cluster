import argon2 from "argon2";
import type { PasswordHasher } from "../../domain/security/password-hasher";

/**
 * Impl da PasswordHasher com argon2id (default seguro do argon2). Vive só na
 * infraestrutura; application/domain consomem a port `PasswordHasher`.
 */
export const passwordHasher: PasswordHasher = {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  },
  verify(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  },
};
