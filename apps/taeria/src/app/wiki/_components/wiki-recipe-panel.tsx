import { ArrowRightIcon } from "lucide-react";

import type { WikiLayoutField } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";

type WikiRecipePanelProps = {
  fields: WikiLayoutField[];
};

function readField(fields: WikiLayoutField[], key: string): string | null {
  const field = fields.find((item) => item.key === key);
  if (
    field?.value === undefined ||
    field.value === null ||
    field.value === ""
  ) {
    return null;
  }
  return String(field.value);
}

function WikiRecipePanel({ fields }: WikiRecipePanelProps) {
  const insumos = readField(fields, "insumos");
  const saida = readField(fields, "saida");
  const habilidadeMinima = readField(fields, "habilidade_minima");

  if (!insumos && !saida && !habilidadeMinima) {
    return null;
  }

  return (
    <section
      aria-label="Crafting"
      className="border-border bg-muted/30 space-y-4 rounded-xl border p-5"
    >
      {insumos || saida ? (
        <div className="flex flex-wrap items-center gap-3 text-base">
          <span className="bg-background rounded-md border px-3 py-2">
            {insumos ?? "Insumos não informados"}
          </span>
          <ArrowRightIcon className="text-muted-foreground size-5 shrink-0" />
          <span className="bg-background rounded-md border px-3 py-2">
            {saida ?? "Saída não informada"}
          </span>
        </div>
      ) : null}
      {habilidadeMinima ? (
        <p className="text-muted-foreground text-sm">
          Habilidade mínima:{" "}
          <span className="text-foreground font-medium">
            {habilidadeMinima}
          </span>
        </p>
      ) : null}
    </section>
  );
}

export { WikiRecipePanel };
