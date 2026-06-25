import type { User } from "../../domain/user";
import { USER_ERRORS } from "../../domain/errors";
import { getUserRepository } from "../../infrastructure/user.repository.factory";
import type { CreateUserInput } from "../schemas/user.schema";

/**
 * Cria um usuário (perfil). Assume input já validado pelo `createUserSchema`.
 * Aplica a regra de negócio de email único.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const repo = await getUserRepository();

  const existing = await repo.findByEmail(input.email);
  if (existing) {
    throw USER_ERRORS.create("EMAIL_TAKEN", { meta: { email: input.email } });
  }

  return repo.create({
    email: input.email,
    name: input.name ?? null,
    role: input.role,
  });
}
