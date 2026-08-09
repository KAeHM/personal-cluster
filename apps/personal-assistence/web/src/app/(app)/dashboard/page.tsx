import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardOnboarding } from "@/components/dashboard/DashboardOnboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDashboardFilters } from "@/lib/dashboard/filters";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getShellUser } from "@/lib/shell/get-shell-user";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      params.set(key, value);
    }
  }

  return params;
}

function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <Skeleton className="h-5 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  noStore();

  const shellUser = await getShellUser();
  const rawParams = await searchParams;
  const filters = parseDashboardFilters(toUrlSearchParams(rawParams));
  const initialData = await getDashboardData(
    shellUser.id,
    shellUser.timezone,
    filters,
  );

  return (
    <>
      {!shellUser.hasCompletedOnboarding && (
        <DashboardOnboarding userName={shellUser.name} />
      )}
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent
          initialData={initialData}
          timezone={shellUser.timezone}
        />
      </Suspense>
    </>
  );
}
