import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

type WikiEntryNavProps = {
  kindName: string;
  kindSlug: string;
  title: string;
};

function WikiEntryNav({ kindName, kindSlug, title }: WikiEntryNavProps) {
  return (
    <nav
      aria-label="Navegação do artigo"
      className="mx-auto max-w-6xl px-4 pt-8"
    >
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        <li>
          <Link
            href="/wiki"
            className="hover:text-foreground transition-colors"
          >
            Wiki
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRightIcon className="size-3.5" />
        </li>
        <li>
          <Link
            href={`/wiki/kinds/${encodeURIComponent(kindSlug)}`}
            className="hover:text-foreground transition-colors"
          >
            {kindName}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRightIcon className="size-3.5" />
        </li>
        <li className="text-foreground truncate font-medium">{title}</li>
      </ol>
    </nav>
  );
}

export { WikiEntryNav };
