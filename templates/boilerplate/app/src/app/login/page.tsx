"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/modules/auth/presentation/actions/auth.actions";
import type { SignInState } from "@/modules/auth/presentation/actions/types";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Spinner } from "@/common/components/feedback/spinner";

const initialState: SignInState = { ok: false };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Acesse com suas credenciais. Use o usuário do seed para testar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {state.message && !state.ok ? (
              <p className="text-destructive text-sm">{state.message}</p>
            ) : null}

            <Button type="submit" disabled={pending}>
              {pending ? <Spinner size="sm" /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground fixed top-4 left-4 text-sm"
      >
        ← Início
      </Link>
    </div>
  );
}
