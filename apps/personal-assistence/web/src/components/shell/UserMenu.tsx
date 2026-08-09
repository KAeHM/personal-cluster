"use client";

import { ChevronDown, LifeBuoy, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShell } from "@/components/shell/shell-context";

function getInitials(name: string | null, email: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "TT";
}

export function UserMenu() {
  const { user } = useShell();
  const displayName = user.name?.trim() || "Usuário";
  const displayEmail = user.email ?? "—";
  const initials = getInitials(user.name, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-foreground/90 h-9 gap-2 px-2 hover:bg-white/10 hover:text-white"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-white/15 text-[11px] text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
            {displayName}
          </span>
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-2 p-3 font-normal">
          <p className="text-sm leading-none font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-xs">
            {displayEmail}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="mailto:suporte@timetracker.app"
            className="cursor-pointer gap-2"
          >
            <LifeBuoy className="size-4" />
            Suporte
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
          onClick={() => signOut({ callbackUrl: "/auth" })}
        >
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
