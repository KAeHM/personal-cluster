import type { LucideIcon } from "lucide-react";
import { CreditCard, MessageCircle, Sparkles } from "lucide-react";

export type OnboardingStepId = "welcome" | "phone" | "plan";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Step can be skipped (e.g. phone until Twilio is ready). */
  skippable?: boolean;
};

/**
 * Ordered onboarding steps. Add or reorder entries here as the product grows.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Como funciona",
    description:
      "Registre tarefas pelo WhatsApp ou pelo dashboard. O assistente entende linguagem natural para iniciar, pausar e encerrar atividades.",
    icon: Sparkles,
  },
  {
    id: "phone",
    title: "Vincular WhatsApp",
    description:
      "Conecte seu número para registrar horas por mensagem. Em breve: validação por SMS com Twilio.",
    icon: MessageCircle,
    skippable: true,
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
