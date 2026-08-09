import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/common/components/ui/badge";
import { kindGradientStyle } from "./wiki-utils";

type WikiHubCardProps = {
  slug: string;
  title: string;
  kindName: string;
  kindSlug: string;
  excerpt: string | null;
  bannerUrl?: string;
};

function WikiHubCard({
  slug,
  title,
  kindName,
  kindSlug,
  excerpt,
  bannerUrl,
}: WikiHubCardProps) {
  return (
    <article className="border-border hover:border-primary/40 flex h-full flex-col overflow-hidden rounded-xl border transition-colors">
      <Link href={`/wiki/${slug}`} className="group block">
        <div
          className="relative aspect-video overflow-hidden"
          style={bannerUrl ? undefined : kindGradientStyle(kindSlug)}
        >
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt=""
              fill
              className="object-cover transition-transform group-hover:scale-[1.02]"
              unoptimized
            />
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/wiki/${slug}`}
            className="font-display text-lg leading-snug font-medium hover:underline"
          >
            {title}
          </Link>
          <Link href={`/wiki/kinds/${kindSlug}`} className="shrink-0">
            <Badge variant="outline">{kindName}</Badge>
          </Link>
        </div>
        <Link
          href={`/wiki/${slug}`}
          className="text-muted-foreground line-clamp-3 text-base hover:underline"
        >
          {excerpt ?? "Sem resumo disponível para esta entrada."}
        </Link>
      </div>
    </article>
  );
}

export { WikiHubCard };
