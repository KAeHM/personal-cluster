export type FinanceBoxProfile =
  | "debt"
  | "investment"
  | "fixed_cost"
  | "goal"
  | "spending"
  | "other";

export type FinanceBox = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  profile: FinanceBoxProfile;
  targetAmountCents: number | null;
  priority: number;
  color: string | null;
  icon: string | null;
  config: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FinanceBoxWithBalance = FinanceBox & {
  balanceCents: number;
  progressPercent: number | null;
  isNegative: boolean;
};
