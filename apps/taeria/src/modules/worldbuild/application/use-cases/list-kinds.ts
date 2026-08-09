import type { Kind } from "../../domain/kind";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";

/** Lista todos os kinds com suas facetas. */
export async function listKinds(): Promise<Kind[]> {
  const repo = await getKindRepository();
  return repo.list();
}
