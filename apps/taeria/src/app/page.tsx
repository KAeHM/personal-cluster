import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpenIcon,
  DicesIcon,
  MapIcon,
  ScrollTextIcon,
  UsersIcon,
} from "lucide-react";

import { getSession } from "@/modules/auth";
import { ThemeToggle } from "@/common/components/theme-toggle";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";

const pillars = [
  {
    icon: MapIcon,
    title: "Worldbuild",
    description:
      "Territórios, raças, criaturas, recursos, receitas e lendas — o universo Taeria documentado em profundidade.",
  },
  {
    icon: UsersIcon,
    title: "Mesas",
    description:
      "O Mestre cria mesas, convida jogadores e cada um cuida dos próprios personagens.",
  },
  {
    icon: ScrollTextIcon,
    title: "Sessões",
    description:
      "Quando chega a hora de jogar, o Mestre reúne os personagens e conduz a história na mesa.",
  },
  {
    icon: DicesIcon,
    title: "Rolagens",
    description:
      "Botões que calculam as rolagens do sistema — o resultado vai para o Mestre, que decide o que acontece.",
  },
] as const;

export default async function HomePage() {
  const session = await getSession();
  const isPlayer =
    session &&
    session.user.roles?.includes("user") &&
    !session.user.roles?.includes("admin");

  if (isPlayer) {
    redirect("/wiki");
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="font-display flex items-center gap-2 font-semibold tracking-wide">
            <BookOpenIcon className="text-primary size-5" />
            Taeria
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-16 px-4 py-16">
        <section className="space-y-6">
          <Badge variant="secondary" className="w-fit">
            RPG de mesa
          </Badge>
          <h1 className="text-4xl text-balance sm:text-5xl">
            O mundo, a mesa e a sessão — num só lugar
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
            Taeria é o companheiro digital do meu RPG: um universo próprio com
            lore rico, mesas para jogar com amigos e ferramentas que ajudam o
            Mestre nas rolagens — sem substituir a narrativa na mesa.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">Entrar na mesa</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl">Como funciona</h2>
            <p className="text-muted-foreground text-sm">
              Dois lados do mesmo mundo: documentar Taeria e jogar com o grupo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-border bg-muted/40 space-y-3 rounded-lg border p-6">
          <h2>O que o Taeria não é</h2>
          <p className="text-muted-foreground text-sm text-pretty">
            Não é uma plataforma para cadastrar mundos de terceiros, nem um
            simulador de combate em grid. O Mestre continua narrando e decidindo
            o desfecho das cenas — o app apoia com lore organizado e rolagens
            rápidas quando a regra pede dados.
          </p>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-4xl items-center justify-between px-4 py-6 text-sm">
          <span>Taeria</span>
          <span>Universo proprietário · RPG de mesa</span>
        </div>
      </footer>
    </div>
  );
}
