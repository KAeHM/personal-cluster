import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

type WikiKindNavProps = {
  kindName: string;
};

function WikiKindNav({ kindName }: WikiKindNavProps) {
  return (
    <nav aria-label="Navegação do tipo" className="pt-2">
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
        <li className="text-foreground font-medium">{kindName}</li>
      </ol>
    </nav>
  );
}

export { WikiKindNav };
