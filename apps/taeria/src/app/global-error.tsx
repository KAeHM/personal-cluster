"use client";

import { Manrope, JetBrains_Mono } from "next/font/google";
import { ErrorDisplay } from "@/common/components/feedback/error-display";
import { ThemeProvider } from "@/common/components/theme-provider";
import "./globals.css";

const fontSans = Manrope({
  variable: "--font-sans-base",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono-base",
  subsets: ["latin"],
  display: "swap",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fontSans.variable} ${fontMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col items-center justify-center p-6">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="w-full max-w-lg">
            <ErrorDisplay
              error={error}
              title="Erro crítico"
              description="A aplicação encontrou um erro inesperado. Informe a referência abaixo ao suporte."
              onRetry={reset}
            />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
