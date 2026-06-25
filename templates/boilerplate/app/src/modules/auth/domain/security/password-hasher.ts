/**
 * Port de hashing de senha. Provider-agnostic: a implementação concreta
 * (bcrypt, argon2, ...) vive em infrastructure/security.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
