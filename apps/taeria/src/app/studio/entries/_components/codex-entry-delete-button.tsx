"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteCodexEntryAction } from "@/modules/worldbuild/presentation/actions/codex.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/common/components/ui/alert-dialog";
import { Button } from "@/common/components/ui/button";
import { Spinner } from "@/common/components/feedback/spinner";

type CodexEntryDeleteButtonProps = {
  entryId: string;
  entryTitle: string;
  redirectTo?: string;
  variant?: "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
};

function CodexEntryDeleteButton({
  entryId,
  entryTitle,
  redirectTo = "/studio/entries",
  variant = "destructive",
  size = "default",
}: CodexEntryDeleteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCodexEntryAction(entryId);
      if (!result.ok) {
        setError(result.message ?? "Não foi possível remover.");
        return;
      }
      setOpen(false);
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir &ldquo;{entryTitle}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Facetas, relações e embeddings
            associados serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
          >
            {pending ? <Spinner size="sm" /> : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { CodexEntryDeleteButton };
