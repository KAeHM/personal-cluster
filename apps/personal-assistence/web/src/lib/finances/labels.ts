import type { FinanceBoxProfile } from "@/modules/finances/domain/box.entity";

export const BOX_PROFILE_LABELS: Record<FinanceBoxProfile, string> = {
  debt: "Dívida",
  investment: "Investimento",
  fixed_cost: "Custo fixo",
  goal: "Meta",
  spending: "Gastos do mês",
  other: "Outro",
};

export const BOX_PROFILE_OPTIONS = Object.entries(BOX_PROFILE_LABELS).map(
  ([value, label]) => ({
    value: value as FinanceBoxProfile,
    label,
  }),
);
