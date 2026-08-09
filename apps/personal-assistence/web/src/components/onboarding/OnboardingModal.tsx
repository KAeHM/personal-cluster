"use client";

import { useCallback, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/lib/onboarding/steps";

type OnboardingModalProps = {
  open: boolean;
  userName?: string | null;
  onComplete: () => void;
};

async function completeOnboarding(): Promise<boolean> {
  const response = await fetch("/api/user/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete" }),
  });

  return response.ok;
}

export function OnboardingModal({
  open,
  userName,
  onComplete,
}: OnboardingModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = ONBOARDING_STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  const finish = useCallback(async () => {
    setLoading(true);
    setError(null);

    const ok = await completeOnboarding();

    if (!ok) {
      setError("Não foi possível concluir o onboarding. Tente novamente.");
      setLoading(false);
      return;
    }

    onComplete();
    setLoading(false);
  }, [onComplete]);

  async function handleNext() {
    if (isLastStep) {
      await finish();
      return;
    }

    setStepIndex((index) => index + 1);
  }

  function handleBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function handleSkip() {
    if (isLastStep) {
      void finish();
      return;
    }

    setStepIndex((index) => index + 1);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* Fechamento só após concluir/pular no último passo */
      }}
    >
      <DialogContent
        className="max-w-md gap-0 p-0 sm:max-w-lg"
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="border-border/60 border-b px-6 py-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle>
              Bem-vindo{userName ? `, ${userName.split(" ")[0]}` : ""}
            </DialogTitle>
            <DialogDescription>
              Configure sua conta em poucos passos
            </DialogDescription>
          </DialogHeader>

          <ol
            className="mt-6 flex items-center gap-1"
            aria-label="Progresso do onboarding"
          >
            {ONBOARDING_STEPS.map((step, index) => {
              const isActive = index === stepIndex;
              const isDone = index < stepIndex;

              return (
                <li key={step.id} className="flex flex-1 items-center gap-1">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      isDone && "bg-primary text-primary-foreground",
                      isActive &&
                        "bg-primary/15 text-primary ring-primary/30 ring-2",
                      !isDone && !isActive && "bg-muted text-muted-foreground",
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isDone ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 rounded-full",
                        isDone ? "bg-primary" : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-4 px-6 py-5">
          <StepContent stepId={currentStep.id} step={currentStep} />

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="border-border/60 bg-muted/30 border-t px-6 py-4">
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={isFirstStep || loading}
              className={cn(isFirstStep && "invisible")}
            >
              <ChevronLeft className="size-4" />
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              {currentStep.skippable && !isLastStep && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  Pular
                </Button>
              )}
              {currentStep.skippable && isLastStep && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void finish()}
                  disabled={loading}
                >
                  Depois
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => void handleNext()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isLastStep ? (
                  "Começar"
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StepContent({
  stepId,
  step,
}: {
  stepId: OnboardingStepId;
  step: (typeof ONBOARDING_STEPS)[number];
}) {
  const Icon = step.icon;

  if (stepId === "welcome") {
    return (
      <div className="space-y-4">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">{step.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.description}
          </p>
        </div>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-primary">1.</span>
            Inicie e finalize tarefas pelo dashboard.
          </li>
          <li className="flex gap-2">
            <span className="text-primary">2.</span>
            Acompanhe horas, métricas e relatórios.
          </li>
          <li className="flex gap-2">
            <span className="text-primary">3.</span>
            Organize atividades por contexto (cliente, projeto, etc.).
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
        <Icon className="size-6" />
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">{step.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {step.description}
        </p>
      </div>
      <div className="border-primary/30 bg-primary/5 rounded-lg border p-4">
        <p className="text-sm font-medium">Plano Gratuito</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Timesheet completo pelo dashboard. Sem custo no momento.
        </p>
      </div>
    </div>
  );
}
