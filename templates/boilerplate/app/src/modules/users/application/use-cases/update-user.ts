import type { User } from "../../domain/user";
import { USER_ERRORS } from "../../domain/errors";
import { getUserRepository } from "../../infrastructure/user.repository.factory";
import type { UpdateUserInput } from "../schemas/user.schema";

/**
 * Atualiza um usuário. Assume input já validado pelo `updateUserSchema`.
 * Lança `USER_NOT_FOUND` se o id não existir.
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User> {
  const repo = await getUserRepository();
  const updated = await repo.update(id, input);

  if (!updated) {
    throw USER_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  return updated;
}
