"use client";

import * as React from "react";
import { cn } from "@/common/utils/cn";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { AppShellThemeToggle } from "./app-shell-theme-toggle";

type AppShellUserMenuUser = {
  name: string;
  email?: string;
  avatarUrl?: string;
};

type AppShellUserMenuItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
  destructive?: boolean;
};

type AppShellUserMenuProps = {
  user: AppShellUserMenuUser;
  items?: AppShellUserMenuItem[];
  showThemeToggle?: boolean;
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function AppShellUserMenu({
  user,
  items = [],
  showThemeToggle = true,
  className,
}: AppShellUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label={`Menu de ${user.name}`}
        >
          <Avatar className="size-8">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-muted text-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{user.name}</p>
            {user.email ? (
              <p className="text-muted-foreground text-xs leading-none">
                {user.email}
              </p>
            ) : null}
          </div>
        </DropdownMenuLabel>

        {showThemeToggle ? (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-muted-foreground text-sm">Aparência</span>
              <AppShellThemeToggle />
            </div>
          </>
        ) : null}

        {items.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  variant={item.destructive ? "destructive" : "default"}
                  onSelect={item.onSelect}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AppShellUserMenu };
export type { AppShellUserMenuItem, AppShellUserMenuUser };
