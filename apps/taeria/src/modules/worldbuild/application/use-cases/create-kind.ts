import type { Kind } from "../../domain/kind";
import { KIND_ERRORS } from "../../domain/errors";
import { getKindRepository } from "../../infrastructure/kind.repository.factory";
import type { CreateKindInput } from "../schemas/kind.schema";

/**
 * Cria um kind com suas facetas. Assume input já validado pelo `createKindSchema`.
 */
export async function createKind(input: CreateKindInput): Promise<Kind> {
  const repo = await getKindRepository();

  const existing = await repo.findBySlug(input.slug);
  if (existing) {
    throw KIND_ERRORS.create("SLUG_TAKEN", { meta: { slug: input.slug } });
  }

  return repo.create({
    slug: input.slug,
    name: input.name,
    description: input.description,
    aiPrompt: input.aiPrompt,
    facets: input.facets,
  });
}
