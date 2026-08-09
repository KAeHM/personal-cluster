import type {
  FinanceMovement,
  FinanceMovementWithMeta,
  FinanceTransfer,
} from "../movement.entity";

export type CreateMovementInput = {
  userId: string;
  boxId: string;
  type: "income" | "expense";
  amountCents: number;
  categoryId?: string | null;
  description?: string | null;
  occurredAt: Date;
  transferId?: string | null;
};

export type CreateTransferInput = {
  userId: string;
  fromBoxId: string;
  toBoxId: string;
  amountCents: number;
  description?: string | null;
  occurredAt: Date;
};

export type ListMovementsOptions = {
  limit?: number;
  offset?: number;
  from?: Date;
  to?: Date;
};

export interface MovementRepository {
  findById(userId: string, movementId: string): Promise<FinanceMovement | null>;
  listByBox(
    userId: string,
    boxId: string,
    options?: ListMovementsOptions,
  ): Promise<FinanceMovementWithMeta[]>;
  listRecent(userId: string, limit: number): Promise<FinanceMovementWithMeta[]>;
  listAllForUser(userId: string): Promise<FinanceMovement[]>;
  create(input: CreateMovementInput): Promise<FinanceMovement>;
  createTransfer(input: CreateTransferInput): Promise<{
    transfer: FinanceTransfer;
    fromMovement: FinanceMovement;
    toMovement: FinanceMovement;
  }>;
  getBalancesByBox(userId: string): Promise<Map<string, number>>;
}
