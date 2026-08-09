import type { FinanceCategory } from "../movement.entity";

export type CreateCategoryInput = {
  userId: string;
  name: string;
  color?: string | null;
};

export interface CategoryRepository {
  findById(userId: string, categoryId: string): Promise<FinanceCategory | null>;
  findByNormalizedName(
    userId: string,
    normalizedName: string,
  ): Promise<FinanceCategory | null>;
  listByUser(userId: string): Promise<FinanceCategory[]>;
  create(input: CreateCategoryInput): Promise<FinanceCategory>;
}
