import { Badge } from "@/components/ui/badge";
import type { ContextItem } from "@/lib/contexts/types";

type WorkGroupsPanelProps = {
  workGroups: ContextItem[];
};

export function WorkGroupsPanel({ workGroups }: WorkGroupsPanelProps) {
  if (workGroups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum contexto registrado ainda. Contextos são criados automaticamente
        quando você menciona clientes ou projetos no WhatsApp.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workGroups.map((group) => (
        <div
          key={group.id}
          className="rounded-lg border border-border/60 px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{group.label}</p>
            <span className="text-xs text-muted-foreground">
              {group.usageCount}{" "}
              {group.usageCount === 1 ? "uso" : "usos"}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {group.id.slice(0, 8)} · chave: {group.normalizedKey}
          </p>
          {group.aliases.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground">Aliases:</span>
              {group.aliases.map((alias) => (
                <Badge key={alias} variant="secondary" className="text-xs">
                  {alias}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Sem aliases registrados
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
