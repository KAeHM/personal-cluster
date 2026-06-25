import { Suspense } from "react";
import { CardSkeleton } from "@/common/components/feedback/card-skeleton";
import { ListSkeleton } from "@/common/components/feedback/list-skeleton";
import { COMMON_ERRORS, logError, toClientError } from "@/common/errors";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";
import { PreviewClientBoundary } from "./_components/preview-client-boundary";
import { PreviewControls } from "./_components/preview-controls";
import { PreviewKnownError } from "./_components/preview-known-error";
import { PreviewMetricsSection } from "./_components/preview-metrics-section";
import { PreviewUsersSection } from "./_components/preview-users-section";

type PreviewPageProps = {
  searchParams: Promise<{
    fail?: string;
    empty?: string;
  }>;
};

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const params = await searchParams;

  if (params.fail === "1") {
    throw new Error(
      "Falha simulada ao carregar /preview. Remova ?fail=1 ou use reset na UI de erro.",
    );
  }

  const empty = params.empty === "1";
  const knownError =
    params.fail === "known"
      ? COMMON_ERRORS.create("NOT_FOUND", {
          meta: { resource: "preview-demo" },
        })
      : null;

  if (knownError) {
    logError(knownError, { route: "/preview", scenario: "known-error-demo" });
  }

  return (
    <div className="space-y-8 p-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Preview App</PageHeaderTitle>
          <PageHeaderDescription>
            Exemplo de aplicação com AppShell, loading/error da rota,
            observabilidade (digest vs AppError) e requisições simuladas no
            server e no client.
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      {knownError ? (
        <PreviewKnownError payload={toClientError(knownError)} />
      ) : null}

      <Suspense
        fallback={<CardSkeleton className="border-dashed" aria-busy="true" />}
      >
        <PreviewControls />
      </Suspense>

      <Suspense
        fallback={
          <div className="space-y-4">
            <CardSkeleton />
            <div className="grid gap-4 sm:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        }
      >
        <PreviewMetricsSection />
      </Suspense>

      <Suspense fallback={<ListSkeleton count={4} />}>
        <PreviewUsersSection empty={empty} />
      </Suspense>

      <PreviewClientBoundary />
    </div>
  );
}
