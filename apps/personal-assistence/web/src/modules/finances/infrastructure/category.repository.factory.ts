import { drizzleCategoryRepository } from "./adapters/drizzle/category.repository";

export function getCategoryRepository() {
  return drizzleCategoryRepository;
}
