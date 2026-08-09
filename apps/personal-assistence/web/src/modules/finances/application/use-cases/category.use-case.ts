import { FINANCE_ERRORS } from "../../domain/errors";
import { normalizeFinanceName } from "../../domain/normalize";
import { getCategoryRepository } from "../../infrastructure/category.repository.factory";
import type { CreateCategoryInput } from "../schemas/category.schema";

export async function listCategories(userId: string) {
  const categoryRepo = getCategoryRepository();
  return categoryRepo.listByUser(userId);
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
) {
  const categoryRepo = getCategoryRepository();
  const normalizedName = normalizeFinanceName(input.name);

  if (!normalizedName) {
    throw FINANCE_ERRORS.create("CATEGORY_NOT_FOUND", {
      messageOverride: "Nome da categoria é inválido.",
    });
  }

  const existing = await categoryRepo.findByNormalizedName(
    userId,
    normalizedName,
  );

  if (existing) {
    throw FINANCE_ERRORS.create("CATEGORY_ALREADY_EXISTS");
  }

  return categoryRepo.create({
    userId,
    name: input.name.trim(),
    color: input.color ?? null,
  });
}
