import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";

import { requireRole } from "@/modules/auth";
import { listCodexEntries, listKinds } from "@/modules/worldbuild";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderRow,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { CodexEntryDeleteButton } from "./_components/codex-entry-delete-button";
import { EntriesKindFilter } from "./_components/entries-kind-filter";

type EntriesPageProps = {
  searchParams: Promise<{ q?: string; kind?: string }>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function StudioEntriesPage({
  searchParams,
}: EntriesPageProps) {
  await requireRole("admin");
  const { q, kind } = await searchParams;
  const kindSlug = kind && kind !== "all" ? kind : undefined;

  const [{ entries, total }, kinds] = await Promise.all([
    listCodexEntries({ query: q, kindSlug, limit: 50 }),
    listKinds(),
  ]);

  return (
    <div className="p-6">
      <PageHeader>
        <PageHeaderRow>
          <PageHeaderContent>
            <PageHeaderTitle>Entradas do codex</PageHeaderTitle>
            <PageHeaderDescription>
              Todas as entidades do worldbuild — privadas, públicas e
              compartilhadas.
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <Button asChild>
              <Link href="/studio/create?mode=form">
                <PlusIcon />
                Nova entrada
              </Link>
            </Button>
          </PageHeaderActions>
        </PageHeaderRow>
      </PageHeader>

      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-[200px] flex-1 space-y-1">
          <label htmlFor="entries-q" className="text-sm font-medium">
            Buscar
          </label>
          <Input
            id="entries-q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Título ou slug…"
          />
        </div>
        <EntriesKindFilter kinds={kinds} defaultValue={kind ?? "all"} />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            {total} {total === 1 ? "entrada" : "entradas"}
          </CardTitle>
          {q || kindSlug ? (
            <CardDescription>
              Filtros ativos
              {q ? `: "${q}"` : ""}
              {kindSlug ? ` · tipo ${kindSlug}` : ""}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              Nenhuma entrada encontrada.
            </p>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/studio/entries/${entry.id}`}
                      className="font-medium hover:underline"
                    >
                      {entry.title}
                    </Link>
                    <p className="text-muted-foreground font-mono text-xs">
                      {entry.slug}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{entry.kindSlug}</Badge>
                      <Badge
                        variant={
                          entry.visibility === "public"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {entry.visibility === "public" ? "Público" : "Privado"}
                      </Badge>
                      {entry.shareCount > 0 ? (
                        <Badge variant="outline">
                          Compartilhado ({entry.shareCount})
                        </Badge>
                      ) : null}
                      <span className="text-muted-foreground text-xs">
                        {formatDate(entry.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/studio/entries/${entry.id}/edit`}>
                        <PencilIcon />
                        Editar
                      </Link>
                    </Button>
                    <CodexEntryDeleteButton
                      entryId={entry.id}
                      entryTitle={entry.title}
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
