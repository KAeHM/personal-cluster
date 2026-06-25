"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2Icon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/modules/users/domain/user";
import { USER_ROLES } from "@/modules/users/domain/role";
import {
  createUserAction,
  deleteUserAction,
} from "@/modules/users/presentation/actions/user.actions";
import type { UserActionState } from "@/modules/users/presentation/actions/types";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/common/components/feedback/empty-state";
import { Spinner } from "@/common/components/feedback/spinner";
import { ConfirmAction } from "@/common/components/patterns/confirm-action";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";

const initialState: UserActionState = { ok: false };

function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (!state.ok && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="new-email">Email</Label>
        <Input
          id="new-email"
          name="email"
          type="email"
          placeholder="novo@example.com"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-name">Nome</Label>
        <Input id="new-name" name="name" placeholder="Nome completo" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-role">Role</Label>
        <Select name="role" defaultValue="user">
          <SelectTrigger id="new-role" className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="sm:col-span-3">
        {pending ? <Spinner size="sm" /> : <UserPlusIcon />}
        Criar usuário
      </Button>
    </form>
  );
}

function UserRow({ user }: { user: User }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (result.ok) {
        toast.success(result.message ?? "Usuário removido.");
      } else {
        toast.error(result.message ?? "Falha ao remover.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <p className="truncate font-medium">{user.name ?? "—"}</p>
        <p className="text-muted-foreground truncate text-sm">{user.email}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={user.role === "admin" ? "info" : "secondary"}>
          {user.role}
        </Badge>
        <ConfirmAction
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover ${user.email}`}
              disabled={pending}
            >
              {pending ? <Spinner size="sm" /> : <Trash2Icon />}
            </Button>
          }
          title="Remover este usuário?"
          description={`${user.email} será removido permanentemente.`}
          confirmLabel="Remover"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}

export function PreviewUsers({
  users,
  canManage,
}: {
  users: User[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-4">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novo usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateUserForm />
          </CardContent>
        </Card>
      ) : null}

      {users.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon>
            <UserPlusIcon />
          </EmptyStateIcon>
          <EmptyStateTitle>Nenhum usuário</EmptyStateTitle>
          <EmptyStateDescription>
            Rode <code>npm run db:seed</code> para popular ou crie um acima
            (requer sessão).
          </EmptyStateDescription>
        </EmptyState>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipe ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-border divide-y p-0">
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
