import { Badge } from "@/components/ui/badge";
import type { ContextItem } from "@/lib/contexts/types";

type WorkGroupsPanelProps = {
  workGroups: ContextItem[];
};

export function WorkGroupsPanel({ workGroups }: WorkGroupsPanelProps) {
  if (workGroups.length === 0) {
    return (
      <div className="border-border/60 text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
        Nenhum contexto registrado ainda. Contextos são criados automaticamente
        quando você associa clientes ou projetos às tarefas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workGroups.map((group) => (
        <div
          key={group.id}
          className="border-border/60 rounded-lg border px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{group.label}</p>
            <span className="text-muted-foreground text-xs">
              {group.usageCount} {group.usageCount === 1 ? "uso" : "usos"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {group.id.slice(0, 8)} · chave: {group.normalizedKey}
          </p>
          {group.aliases.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-muted-foreground text-xs">Aliases:</span>
              {group.aliases.map((alias) => (
                <Badge key={alias} variant="secondary" className="text-xs">
                  {alias}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 text-xs">
              Sem aliases registrados
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
