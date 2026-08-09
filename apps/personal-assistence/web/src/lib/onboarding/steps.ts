import type { LucideIcon } from "lucide-react";
import { CreditCard, Sparkles } from "lucide-react";

export type OnboardingStepId = "welcome" | "plan";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  icon: LucideIcon;
  skippable?: boolean;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Como funciona",
    description:
      "Registre tarefas pelo dashboard: inicie, pause, retome e finalize atividades. Acompanhe horas e métricas em tempo real.",
    icon: Sparkles,
  },
  {
    id: "plan",
    title: "Escolher plano",
    description:
      "Comece no plano gratuito. Planos pagos com mais recursos estarão disponíveis em breve.",
    icon: CreditCard,
    skippable: true,
  },
];

export function getOnboardingStepIndex(stepId: OnboardingStepId): number {
  return ONBOARDING_STEPS.findIndex((step) => step.id === stepId);
}
