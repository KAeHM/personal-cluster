/**
 * Credenciais de autenticação local (self-hosted). Pertencem ao domínio de
 * `auth` (segurança), separadas do perfil do usuário em `modules/users`.
 * Ligadas ao usuário por `userId`.
 */
export interface Credentials {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface NewCredentials {
  userId: string;
  email: string;
  passwordHash: string;
}
