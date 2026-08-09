import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";

import { requireRole } from "@/modules/auth";
import { getCodexEntryDetail } from "@/modules/worldbuild";
import { CodexEntryDeleteButton } from "@/app/studio/entries/_components/codex-entry-delete-button";
import { CodexEntryDetailTabs } from "@/app/studio/entries/[id]/_components/codex-entry-detail-tabs";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";

type EntryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioEntryPage({ params }: EntryPageProps) {
  await requireRole("admin");
  const { id } = await params;

  let detail;
  try {
    detail = await getCodexEntryDetail(id);
  } catch {
    notFound();
  }

  const { entry, kind, edgesWithTargets } = detail;

  const visualFacet = entry.facets.find(
    (facet) => facet.facetType === "visual",
  );
  const bannerUrl =
    typeof visualFacet?.data.banner_url === "string"
      ? visualFacet.data.banner_url
      : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{entry.title}</h1>
            <Badge variant="outline">{kind.name}</Badge>
            <Badge
              variant={entry.visibility === "public" ? "default" : "secondary"}
            >
              {entry.visibility === "public" ? "Público" : "Privado"}
            </Badge>
            {entry.sharedUserIds && entry.sharedUserIds.length > 0 ? (
              <Badge variant="outline">
                Compartilhado ({entry.sharedUserIds.length})
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground font-mono text-sm">
            {entry.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/studio/entries/${entry.id}/edit`}>
              <PencilIcon />
              Editar
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/studio/kinds/create/${kind.slug}`}>
              <PlusIcon />
              Criar similar
            </Link>
          </Button>
          <CodexEntryDeleteButton
            entryId={entry.id}
            entryTitle={entry.title}
            variant="outline"
          />
        </div>
      </div>

      {bannerUrl ? (
        <div className="overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt={`Banner de ${entry.title}`}
            className="aspect-[21/9] w-full object-cover"
          />
        </div>
      ) : null}

      <CodexEntryDetailTabs
        entry={entry}
        kind={kind}
        edgesWithTargets={edgesWithTargets}
      />
    </div>
  );
}
