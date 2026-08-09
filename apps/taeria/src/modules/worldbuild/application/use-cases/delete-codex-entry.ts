import { CODEX_ERRORS } from "../../domain/errors";
import { getCodexRepository } from "../../infrastructure/codex.repository.factory";

export async function deleteCodexEntry(id: string): Promise<void> {
  const repo = await getCodexRepository();
  const deleted = await repo.delete(id);
  if (!deleted) {
    throw CODEX_ERRORS.create("NOT_FOUND", { meta: { id } });
  }
}
