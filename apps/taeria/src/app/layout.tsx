import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Lora } from "next/font/google";
import { ThemeProvider } from "@/common/components/theme-provider";
import { Toaster } from "@/common/components/ui/sonner";
import "./globals.css";

// Corpo: Lora (serif legível). Títulos: Cinzel (épico/RPG). Mono: JetBrains.
const fontBody = Lora({
  variable: "--font-sans-base",
  subsets: ["latin"],
  display: "swap",
});

const fontDisplay = Cinzel({
  variable: "--font-display-base",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono-base",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Taeria",
  description:
    "Companheiro digital do RPG Taeria — worldbuild, mesas e sessões de jogo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable} h-full`}
    >
      <body className="h-full overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="h-full min-h-0">{children}</div>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
