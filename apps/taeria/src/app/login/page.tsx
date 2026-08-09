"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "lucide-react";

import { signInAction } from "@/modules/auth/presentation/actions/auth.actions";
import type { SignInState } from "@/modules/auth/presentation/actions/types";
import { DotPattern } from "@/common/components/effects/dot-pattern";
import { LoginHeroPanel } from "@/common/components/patterns/login-hero-panel";
import { ThemeToggle } from "@/common/components/theme-toggle";
import { Spinner } from "@/common/components/feedback/spinner";
import { Badge } from "@/common/components/ui/badge";
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
import { Separator } from "@/common/components/ui/separator";

const initialState: SignInState = { ok: false };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid h-full overflow-y-auto lg:grid-cols-2">
      <div className="relative flex flex-col">
        <DotPattern
          width={24}
          height={24}
          className="text-muted-foreground/20 lg:hidden"
        />

        <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/">
              <ArrowLeftIcon />
              Início
            </Link>
          </Button>
          <ThemeToggle />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10 md:px-8">
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="mb-8 space-y-3 lg:hidden"
            >
              <div className="font-display flex items-center gap-2 text-lg font-semibold tracking-wide">
                <BookOpenIcon className="text-primary size-5" />
                Taeria
              </div>
              <p className="text-muted-foreground text-sm text-pretty">
                Entre na mesa com suas credenciais de jogador ou Mestre.
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-primary/20 bg-card/80 relative overflow-hidden shadow-md backdrop-blur-sm">
                <div
                  aria-hidden="true"
                  className="border-primary/30 pointer-events-none absolute top-0 left-0 size-5 border-t border-l"
                />
                <div
                  aria-hidden="true"
                  className="border-primary/30 pointer-events-none absolute top-0 right-0 size-5 border-t border-r"
                />
                <div
                  aria-hidden="true"
                  className="border-primary/30 pointer-events-none absolute bottom-0 left-0 size-5 border-b border-l"
                />
                <div
                  aria-hidden="true"
                  className="border-primary/30 pointer-events-none absolute right-0 bottom-0 size-5 border-r border-b"
                />

                <CardHeader className="space-y-3">
                  <Badge variant="secondary" className="w-fit">
                    Portal da mesa
                  </Badge>
                  <CardTitle className="text-2xl">Entrar</CardTitle>
                  <CardDescription className="text-pretty">
                    Acesse com o email e a senha enviados pelo Mestre da sua
                    mesa.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form action={formAction} className="grid gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <MailIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          autoComplete="email"
                          required
                          disabled={pending}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <LockIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          disabled={pending}
                          className="pr-9 pl-9"
                        />
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={
                            showPassword ? "Ocultar senha" : "Mostrar senha"
                          }
                        >
                          {showPassword ? (
                            <EyeOffIcon className="size-4" />
                          ) : (
                            <EyeIcon className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {state.message && !state.ok ? (
                      <p
                        role="alert"
                        className="border-destructive/30 bg-destructive/10 text-destructive border px-3 py-2 text-sm"
                      >
                        {state.message}
                      </p>
                    ) : null}

                    <Button type="submit" size="lg" disabled={pending}>
                      {pending ? <Spinner size="sm" /> : null}
                      Entrar
                    </Button>
                  </form>

                  <div className="mt-6 space-y-4">
                    <div className="relative">
                      <Separator />
                      <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
                        convite do Mestre
                      </span>
                    </div>
                    <p className="text-muted-foreground text-center text-xs text-pretty">
                      Não há cadastro aberto. Peça ao Mestre da sua mesa um
                      convite para jogar em Taeria.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>

      <LoginHeroPanel />
    </div>
  );
}
