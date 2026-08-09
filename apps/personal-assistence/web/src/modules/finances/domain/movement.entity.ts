export type FinanceMovementType = "income" | "expense";

export type FinanceMovement = {
  id: string;
  userId: string;
  boxId: string;
  type: FinanceMovementType;
  amountCents: number;
  transferId: string | null;
  categoryId: string | null;
  description: string | null;
  occurredAt: Date;
  createdAt: Date;
};

export type FinanceMovementWithMeta = FinanceMovement & {
  boxName: string;
  categoryName: string | null;
  transferFromBoxName: string | null;
  transferToBoxName: string | null;
};

export type FinanceTransfer = {
  id: string;
  userId: string;
  fromBoxId: string;
  toBoxId: string;
  amountCents: number;
  description: string | null;
  occurredAt: Date;
  createdAt: Date;
};

export type FinanceCategory = {
  id: string;
  userId: string;
  name: string;
  normalizedName: string;
  color: string | null;
  createdAt: Date;
};
