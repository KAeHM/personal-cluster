"use client";

import Link from "next/link";
import { Timer } from "lucide-react";

import { LinkPhoneNavbarButton } from "@/components/shell/LinkPhoneNavbarButton";
import { UserMenu } from "@/components/shell/UserMenu";

export function AppNavbar() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-black/20 bg-[oklch(0.20_0.01_285)] px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-white transition-opacity hover:opacity-90"
      >
        <Timer className="size-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight">Time Tracker</span>
      </Link>

      <div className="flex items-center gap-2">
        <LinkPhoneNavbarButton />
        <UserMenu />
      </div>
    </header>
  );
}
