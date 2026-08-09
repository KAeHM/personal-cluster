import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { listKinds } from "@/modules/worldbuild";
import {
  CONTENT_FACET_TYPES,
  FACET_LABELS,
} from "@/modules/worldbuild/domain/facet-type";
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

export default async function KindsPage() {
  const kinds = await listKinds();

  return (
    <div className="p-6">
      <PageHeader>
        <PageHeaderRow>
          <PageHeaderContent>
            <PageHeaderTitle>Tipos de entidade</PageHeaderTitle>
            <PageHeaderDescription>
              Defina os kinds do worldbuild — facetas de conteúdo, relações e
              schemas para cada tipo de entrada no codex.
            </PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <Button asChild>
              <Link href="/studio/kinds/new">
                <PlusIcon />
                Novo tipo
              </Link>
            </Button>
          </PageHeaderActions>
        </PageHeaderRow>
      </PageHeader>

      {kinds.length === 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Nenhum tipo cadastrado</CardTitle>
            <CardDescription>
              Crie o primeiro kind para começar a estruturar o worldbuild de
              Taeria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/studio/kinds/new">Criar tipo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-6 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kinds.map((kind) => {
            const activeFacets = kind.facets.filter((f) => f.enabled);

            return (
              <li key={kind.id} className="flex">
                <Card className="hover:border-primary/40 flex h-full w-full flex-col transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">
                        <Link
                          href={`/studio/kinds/${kind.id}/edit`}
                          className="hover:underline"
                        >
                          {kind.name}
                        </Link>
                      </CardTitle>
                      {kind.isBuiltin ? (
                        <Badge variant="secondary">Integrado</Badge>
                      ) : null}
                    </div>
                    <CardDescription className="font-mono text-xs">
                      {kind.slug}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm">
                      {kind.description ?? ""}
                    </p>
                    <div className="flex min-h-[1.75rem] flex-wrap gap-1.5">
                      {activeFacets.map((facet) => (
                        <Badge
                          key={facet.id}
                          variant={
                            (CONTENT_FACET_TYPES as readonly string[]).includes(
                              facet.facetType,
                            )
                              ? "default"
                              : "outline"
                          }
                        >
                          {FACET_LABELS[facet.facetType]}
                          {facet.required ? " *" : ""}
                        </Badge>
                      ))}
                      {activeFacets.length === 0 ? (
                        <span className="text-muted-foreground text-xs">
                          Sem facetas ativas
                        </span>
                      ) : null}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-auto w-full"
                    >
                      <Link href={`/studio/kinds/create/${kind.slug}`}>
                        <PlusIcon />
                        Criar entrada
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
