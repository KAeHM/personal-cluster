"use client";

import { useEffect, useState } from "react";

import { listPlayersForShareAction } from "@/modules/worldbuild/presentation/actions/list-players-for-share.action";
import { Badge } from "@/common/components/ui/badge";
import { Label } from "@/common/components/ui/label";
import { Switch } from "@/common/components/ui/switch";
import { cn } from "@/common/utils/cn";

type PlayerOption = {
  id: string;
  email: string;
  name: string | null;
};

type CodexVisibilitySectionProps = {
  visibility: "private" | "public";
  sharedUserIds: string[];
  /** Sem borda externa — use dentro de FormSection. */
  bare?: boolean;
  /** Textos mais curtos para a coluna lateral. */
  compact?: boolean;
  onChange: (patch: {
    visibility?: "private" | "public";
    sharedUserIds?: string[];
  }) => void;
};

function playerLabel(player: PlayerOption): string {
  return player.name?.trim() || player.email;
}

function CodexVisibilitySection({
  visibility,
  sharedUserIds,
  bare = false,
  compact = false,
  onChange,
}: CodexVisibilitySectionProps) {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listPlayersForShareAction()
      .then((result) => {
        if (active) {
          setPlayers(result);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function togglePlayer(userId: string) {
    const next = sharedUserIds.includes(userId)
      ? sharedUserIds.filter((id) => id !== userId)
      : [...sharedUserIds, userId];
    onChange({ sharedUserIds: next });
  }

  return (
    <div className={bare ? "space-y-3" : "space-y-4 rounded-md border p-4"}>
      {!bare ? (
        <div>
          <p className="text-sm font-medium">Visibilidade na wiki</p>
          <p className="text-muted-foreground text-xs">
            Controle o que os jogadores podem ver fora do Studio.
          </p>
        </div>
      ) : compact ? (
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Wiki
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Label htmlFor="codex-visibility" className="text-sm">
            {visibility === "public" ? "Público" : "Privado"}
          </Label>
          {!compact ? (
            <p className="text-muted-foreground text-xs">
              {visibility === "public"
                ? "Qualquer jogador autenticado pode ver."
                : "Só jogadores convidados abaixo (além do Mestre)."}
            </p>
          ) : null}
        </div>
        <Switch
          id="codex-visibility"
          checked={visibility === "public"}
          onCheckedChange={(checked) =>
            onChange({ visibility: checked ? "public" : "private" })
          }
        />
      </div>

      {visibility === "private" ? (
        <div className="space-y-2">
          <Label className="text-sm">
            {compact ? "Compartilhar" : "Compartilhar com jogadores"}
          </Label>
          {loading ? (
            <p className="text-muted-foreground text-xs">
              Carregando jogadores…
            </p>
          ) : players.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Nenhum jogador cadastrado ainda.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map((player) => {
                const selected = sharedUserIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {playerLabel(player)}
                  </button>
                );
              })}
            </div>
          )}
          {sharedUserIds.length > 0 ? (
            <Badge variant="secondary">
              Compartilhado ({sharedUserIds.length})
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { CodexVisibilitySection };
