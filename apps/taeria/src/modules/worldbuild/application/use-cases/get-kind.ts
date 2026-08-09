import type { Kind } from "../../domain/kind";
import { KIND_ERRORS } from "../../domain/errors";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";

/**
 * Busca um kind por id. Lança `KIND_NOT_FOUND` se não existir.
 */
export async function getKind(id: string): Promise<Kind> {
  const repo = await getKindRepository();
  const kind = await repo.findById(id);

  if (!kind) {
    throw KIND_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  return kind;
}

/**
 * Busca um kind por slug. Lança `KIND_NOT_FOUND` se não existir.
 */
export async function getKindBySlug(slug: string): Promise<Kind> {
  const repo = await getKindRepository();
  const kind = await repo.findBySlug(slug);

  if (!kind) {
    throw KIND_ERRORS.create("NOT_FOUND", { meta: { slug } });
  }

  return kind;
}
