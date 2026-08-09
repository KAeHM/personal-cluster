import { KIND_ERRORS } from "../../domain/errors";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";

/**
 * Remove um kind. Lança `KIND_NOT_FOUND` se o id não existir.
 * Bloqueia remoção de kinds integrados (`is_builtin`).
 */
export async function deleteKind(id: string): Promise<void> {
  const repo = await getKindRepository();
  const existing = await repo.findById(id);

  if (!existing) {
    throw KIND_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  if (existing.isBuiltin) {
    throw KIND_ERRORS.create("BUILTIN_DELETE", { meta: { id } });
  }

  // TODO: lançar KIND_IN_USE quando existir codex_entry referenciando este kind.

  const deleted = await repo.delete(id);
  if (!deleted) {
    throw KIND_ERRORS.create("NOT_FOUND", { meta: { id } });
  }
}
