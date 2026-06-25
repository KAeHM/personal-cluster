import { CardSkeleton } from "@/common/components/feedback/card-skeleton";
import { ListSkeleton } from "@/common/components/feedback/list-skeleton";
import { Spinner } from "@/common/components/feedback/spinner";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";

export default function PreviewLoading() {
  return (
    <div className="space-y-8 p-6">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Preview App</PageHeaderTitle>
          <PageHeaderDescription>
            Carregando dados simulados da API…
          </PageHeaderDescription>
        </PageHeaderContent>
      </PageHeader>

      <div className="border-border bg-muted/20 text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm">
        <Spinner size="sm" />
        Este estado vem de{" "}
        <code className="bg-muted rounded px-1 py-0.5 text-xs">
          loading.tsx
        </code>{" "}
        da rota /preview.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <ListSkeleton count={4} />
    </div>
  );
}
