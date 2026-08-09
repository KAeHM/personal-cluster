import type { FinanceBoxConfig } from "@/lib/db/schema";

import type { FinanceBox, FinanceBoxProfile } from "../box.entity";

export type CreateBoxInput = {
  userId: string;
  name: string;
  description?: string | null;
  profile?: FinanceBoxProfile;
  targetAmountCents?: number | null;
  priority?: number;
  color?: string | null;
  icon?: string | null;
  config?: FinanceBoxConfig | null;
};

export type UpdateBoxInput = {
  name?: string;
  description?: string | null;
  profile?: FinanceBoxProfile;
  targetAmountCents?: number | null;
  priority?: number;
  color?: string | null;
  icon?: string | null;
  isActive?: boolean;
  config?: FinanceBoxConfig | null;
};

export interface BoxRepository {
  findById(userId: string, boxId: string): Promise<FinanceBox | null>;
  listByUser(
    userId: string,
    options?: { includeInactive?: boolean },
  ): Promise<FinanceBox[]>;
  create(input: CreateBoxInput): Promise<FinanceBox>;
  update(
    userId: string,
    boxId: string,
    input: UpdateBoxInput,
  ): Promise<FinanceBox | null>;
}
