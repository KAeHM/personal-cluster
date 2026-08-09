"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteKindAction } from "@/modules/worldbuild/presentation/actions/kind.actions";
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

type KindDeleteButtonProps = {
  kindId: string;
  kindName: string;
};

function KindDeleteButton({ kindId, kindName }: KindDeleteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteKindAction(kindId);
      if (!result.ok) {
        setError(result.message ?? "Não foi possível remover.");
        return;
      }
      setOpen(false);
      router.push("/studio/kinds");
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          Excluir tipo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir &ldquo;{kindName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Entidades deste tipo (quando
            existirem) impedirão a exclusão.
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

export { KindDeleteButton };
