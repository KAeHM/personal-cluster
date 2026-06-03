"use client";

import { useRouter } from "next/navigation";

import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

type DashboardOnboardingProps = {
  userName?: string | null;
};

export function DashboardOnboarding({ userName }: DashboardOnboardingProps) {
  const router = useRouter();

  return (
    <OnboardingModal
      open
      userName={userName}
      onComplete={() => {
        router.refresh();
      }}
    />
  );
}
