import type { Kind } from "../../domain/kind";
import { KIND_ERRORS } from "../../domain/errors";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import type { UpdateKindInput } from "../schemas/kind.schema";

/**
 * Atualiza um kind e suas facetas. Assume input já validado pelo `updateKindSchema`.
 */
export async function updateKind(
  id: string,
  input: UpdateKindInput,
): Promise<Kind> {
  const repo = await getKindRepository();
  const existing = await repo.findById(id);

  if (!existing) {
    throw KIND_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  if (existing.isBuiltin && input.slug !== existing.slug) {
    throw KIND_ERRORS.create("BUILTIN_SLUG_IMMUTABLE", {
      meta: { id, slug: existing.slug },
    });
  }

  if (input.slug !== existing.slug) {
    const slugTaken = await repo.findBySlug(input.slug);
    if (slugTaken) {
      throw KIND_ERRORS.create("SLUG_TAKEN", { meta: { slug: input.slug } });
    }
  }

  const updated = await repo.update(id, {
    slug: input.slug,
    name: input.name,
    description: input.description,
    aiPrompt: input.aiPrompt,
    facets: input.facets,
  });

  if (!updated) {
    throw KIND_ERRORS.create("NOT_FOUND", { meta: { id } });
  }

  return updated;
}
