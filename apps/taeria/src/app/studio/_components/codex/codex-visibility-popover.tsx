"use client";

import { useEffect, useState } from "react";
import { GlobeIcon, LockIcon } from "lucide-react";

import { listPlayersForShareAction } from "@/modules/worldbuild/presentation/actions/list-players-for-share.action";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";
import { cn } from "@/common/utils/cn";

type PlayerOption = {
  id: string;
  email: string;
  name: string | null;
};

type CodexVisibilityPopoverProps = {
  visibility: "private" | "public";
  sharedUserIds: string[];
  onChange: (patch: {
    visibility?: "private" | "public";
    sharedUserIds?: string[];
  }) => void;
};

function playerLabel(player: PlayerOption): string {
  return player.name?.trim() || player.email;
}

function CodexVisibilityPopover({
  visibility,
  sharedUserIds,
  onChange,
}: CodexVisibilityPopoverProps) {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const isPublic = visibility === "public";

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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={
            isPublic
              ? "Visibilidade: público. Abrir opções"
              : `Visibilidade: privado${sharedUserIds.length > 0 ? `, compartilhado com ${sharedUserIds.length}` : ""}. Abrir opções`
          }
        >
          {isPublic ? (
            <GlobeIcon className="size-4" />
          ) : (
            <LockIcon className="size-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4 p-4">
        <div>
          <p className="text-sm font-medium">Visibilidade na wiki</p>
          <p className="text-muted-foreground text-xs">
            Controle o que os jogadores podem ver fora do Studio.
          </p>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => onChange({ visibility: "public" })}
            className={cn(
              "hover:bg-muted flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition-colors",
              isPublic ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <GlobeIcon className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Público</span>
              <span className="text-muted-foreground block text-xs">
                Qualquer jogador autenticado pode ver.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ visibility: "private" })}
            className={cn(
              "hover:bg-muted flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition-colors",
              !isPublic ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <LockIcon className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Privado</span>
              <span className="text-muted-foreground block text-xs">
                Só o Mestre e jogadores convidados abaixo.
              </span>
            </span>
          </button>
        </div>

        {!isPublic ? (
          <div className="space-y-2">
            <Label className="text-sm">Compartilhar com jogadores</Label>
            {loading ? (
              <p className="text-muted-foreground text-xs">
                Carregando jogadores…
              </p>
            ) : players.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Nenhum jogador cadastrado ainda.
              </p>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
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
      </PopoverContent>
    </Popover>
  );
}

export { CodexVisibilityPopover };
