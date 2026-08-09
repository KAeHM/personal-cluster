"use client";

import { ThemeProvider as NextThemesProvider } from "@teispace/next-themes";
import type { ComponentProps } from "react";

/**
 * Wrapper do @teispace/next-themes (fork compatível com React 19 / Next 16).
 * Controla o tema via classe `.dark` no <html>.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
