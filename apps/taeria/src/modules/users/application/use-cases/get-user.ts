import type { User } from "../../domain/user";
import { USER_ERRORS } from "../../domain/errors";
import { getUserRepository } from "../../infrastructure/user.repository.factory";

export async function getUser(id: string): Promise<User> {
  const repo = await getUserRepository();
  const user = await repo.findById(id);

  if (!user) {
    throw USER_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  return user;
}
