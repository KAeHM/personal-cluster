import { USER_ERRORS } from "../../domain/errors";
import { getUserRepository } from "../../infrastructure/user.repository.factory";

/**
 * Remove um usuário. Lança `USER_NOT_FOUND` se o id não existir.
 */
export async function deleteUser(id: string): Promise<void> {
  const repo = await getUserRepository();
  const deleted = await repo.delete(id);

  if (!deleted) {
    throw USER_ERRORS.create("NOT_FOUND", { meta: { id } });
  }
}
