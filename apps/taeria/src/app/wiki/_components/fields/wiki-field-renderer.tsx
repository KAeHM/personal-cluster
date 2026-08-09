import Image from "next/image";
import Link from "next/link";

import type { WikiLayoutField } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import { WikiMarkdown } from "./wiki-markdown";

type WikiFieldRendererProps = {
  field: WikiLayoutField;
  compact?: boolean;
  bodyLabel?: string;
};

function WikiFieldRenderer({
  field,
  compact = false,
  bodyLabel,
}: WikiFieldRendererProps) {
  const { label, value, fieldType, wikiPlacement } = field;
  const displayLabel = bodyLabel ?? label;

  if (value === undefined || value === null || value === "") {
    return null;
  }

  const hideMarkdownLabel =
    fieldType === "markdown" && wikiPlacement === "body";

  if (fieldType === "markdown") {
    return (
      <div className="space-y-2">
        {!compact && !hideMarkdownLabel ? (
          <h2 className="text-muted-foreground text-sm font-medium">
            {displayLabel}
          </h2>
        ) : null}
        {compact ? (
          <p className="text-muted-foreground text-sm font-medium">
            {displayLabel}
          </p>
        ) : null}
        <WikiMarkdown markdown={String(value)} />
      </div>
    );
  }

  if (fieldType === "image") {
    const src = String(value);
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <div className="relative aspect-video overflow-hidden rounded-md border">
          <Image
            src={src}
            alt={label}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
    );
  }

  if (fieldType === "boolean") {
    return (
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-base">{value ? "Sim" : "Não"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="text-base">{String(value)}</p>
    </div>
  );
}

type WikiEdgeLinksProps = {
  label: string;
  targets: Array<{ slug: string; title: string }>;
};

function WikiEdgeLinks({ label, targets }: WikiEdgeLinksProps) {
  if (targets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <ul className="space-y-1">
        {targets.map((target) => (
          <li key={target.slug}>
            <Link
              href={`/wiki/${target.slug}`}
              className="text-base hover:underline"
            >
              {target.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { WikiFieldRenderer, WikiEdgeLinks };
