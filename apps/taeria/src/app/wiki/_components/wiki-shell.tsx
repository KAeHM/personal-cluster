"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BookOpenIcon, LayoutDashboardIcon, LogOutIcon } from "lucide-react";

import { signOutAction } from "@/modules/auth/presentation/actions/auth.actions";
import type { AuthUser } from "@/modules/auth/domain/session/session";
import { DotPattern } from "@/common/components/effects/dot-pattern";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/common/utils/cn";
import { WikiSearchForm } from "./wiki-search-form";

type WikiShellProps = {
  user: AuthUser;
  children: React.ReactNode;
};

function WikiShell({ user, children }: WikiShellProps) {
  const pathname = usePathname();
  const isAdmin = user.roles?.includes("admin");
  const isEntryPage =
    pathname.startsWith("/wiki/") &&
    pathname !== "/wiki" &&
    !pathname.startsWith("/wiki/kinds/");
  const isHubLikePage =
    pathname === "/wiki" || pathname.startsWith("/wiki/kinds/");

  return (
    <div className="bg-background relative flex h-full min-h-0 flex-col">
      <DotPattern
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(900px_circle_at_top,white,transparent)] opacity-30"
        cr={1}
        glow={false}
      />

      <header className="border-border/60 bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link
            href="/wiki"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <BookOpenIcon className="size-5" />
            Wiki Taeria
          </Link>

          <Suspense fallback={null}>
            <WikiSearchForm />
          </Suspense>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/studio">
                  <LayoutDashboardIcon className="size-4" />
                  Studio
                </Link>
              </Button>
            ) : null}
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sair"
              >
                <LogOutIcon className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 min-h-0 w-full flex-1",
          isEntryPage
            ? "overflow-hidden"
            : "overflow-y-auto overscroll-y-contain",
        )}
      >
        {isHubLikePage ? (
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

export { WikiShell };
