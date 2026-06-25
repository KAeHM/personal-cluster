import type { Metadata } from "next";
import { PreviewShell } from "./_components/preview-shell";

export const metadata: Metadata = {
  title: "Preview App | Boilerplate",
  description: "Demonstração do AppShell e padrões de feedback do boilerplate.",
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PreviewShell>{children}</PreviewShell>;
}
