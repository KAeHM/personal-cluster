import type { User } from "../../domain/user";
import { getUserRepository } from "../../infrastructure/user.repository.factory";

export async function listUsers(): Promise<User[]> {
  const repo = await getUserRepository();
  return repo.list();
}
