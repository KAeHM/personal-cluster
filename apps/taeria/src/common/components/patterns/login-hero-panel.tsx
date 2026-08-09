import {
  BookOpenIcon,
  DicesIcon,
  MapIcon,
  ScrollTextIcon,
  SparklesIcon,
} from "lucide-react";

import { DotPattern } from "@/common/components/effects/dot-pattern";
import { Badge } from "@/common/components/ui/badge";

const highlights = [
  { icon: MapIcon, label: "Worldbuild" },
  { icon: ScrollTextIcon, label: "Sessões" },
  { icon: DicesIcon, label: "Rolagens" },
] as const;

function LoginHeroPanel() {
  return (
    <aside
      aria-hidden="true"
      className="border-border bg-muted/30 relative hidden overflow-hidden border-l lg:block"
    >
      <div className="from-background via-background/40 to-primary/15 absolute inset-0 bg-gradient-to-br" />
      <div className="from-accent/20 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
      <DotPattern glow width={20} height={20} cr={1.2} className="opacity-60" />

      <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="text-primary size-5" />
          <span className="font-display text-sm font-semibold tracking-widest uppercase">
            Taeria
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <Badge
            variant="outline"
            className="border-primary/30 bg-background/50"
          >
            <SparklesIcon className="size-3" />
            Universo proprietário
          </Badge>

          <blockquote className="space-y-4">
            <p className="font-display text-3xl leading-tight tracking-wide text-balance xl:text-4xl">
              O pergaminho aberto entre o Mestre e a mesa
            </p>
            <p className="text-muted-foreground text-base leading-relaxed text-pretty">
              Lore, personagens e sessões num só lugar — para quando a história
              pede dados, não distrações.
            </p>
          </blockquote>

          <ul className="flex flex-wrap gap-2">
            {highlights.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="border-border bg-background/60 flex items-center gap-2 border px-3 py-1.5 text-sm backdrop-blur-sm"
              >
                <Icon className="text-primary size-4" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          RPG de mesa · Worldbuild · Mesas convidadas
        </p>
      </div>

      <div
        aria-hidden="true"
        className="border-primary/40 pointer-events-none absolute top-8 right-8 size-16 border-t-2 border-r-2"
      />
      <div
        aria-hidden="true"
        className="border-primary/40 pointer-events-none absolute bottom-8 left-8 size-16 border-b-2 border-l-2"
      />
    </aside>
  );
}

export { LoginHeroPanel };
