import Link from "next/link";
import { BookOpenIcon } from "lucide-react";

type WikiEmptyStateProps = {
  variant: "empty" | "no-results";
};

const COPY = {
  empty: {
    title: "Nada disponível ainda",
    description:
      "Quando o Mestre publicar ou compartilhar entradas, elas aparecerão aqui.",
  },
  "no-results": {
    title: "Nenhum resultado",
    description: "Tente outra busca ou remova os filtros.",
  },
} as const;

function WikiEmptyState({ variant }: WikiEmptyStateProps) {
  const { title, description } = COPY[variant];

  return (
    <div className="border-border bg-muted/20 flex flex-col items-center gap-4 rounded-xl border px-6 py-12 text-center">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <BookOpenIcon className="size-6" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-xl">{title}</h2>
        <p className="text-muted-foreground mx-auto max-w-md text-base">
          {description}
        </p>
      </div>
      {variant === "no-results" ? (
        <Link
          href="/wiki"
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver todas as entradas
        </Link>
      ) : null}
    </div>
  );
}

export { WikiEmptyState };
