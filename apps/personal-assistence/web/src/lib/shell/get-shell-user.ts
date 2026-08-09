import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  getDbUserFromSession,
  hasCompletedOnboarding,
} from "@/lib/auth/get-db-user";
import type { ShellUser } from "@/lib/shell/types";

export type ShellUserWithOnboarding = ShellUser & {
  hasCompletedOnboarding: boolean;
};

export async function getShellUser(): Promise<ShellUserWithOnboarding> {
  noStore();

  const session = await auth();

  if (!session?.user) {
    redirect("/auth");
  }

  const user = await getDbUserFromSession(session);

  if (!user) {
    redirect("/auth");
  }

  return {
    id: user.id,
    name: user.name ?? session.user.name ?? null,
    email: user.email ?? session.user.email ?? null,
    timezone: user.timezone,
    hasCompletedOnboarding: hasCompletedOnboarding(user),
  };
}
