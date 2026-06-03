"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, LogIn, Timer, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("Não foi possível entrar. Verifique nome e e-mail informados.");
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? "/dashboard";
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Timer className="size-6" />
        </div>
        <CardTitle className="text-2xl font-semibold">Time Tracker</CardTitle>
        <CardDescription>
          Informe seu nome e e-mail para acessar o dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nome
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
                disabled={loading}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
