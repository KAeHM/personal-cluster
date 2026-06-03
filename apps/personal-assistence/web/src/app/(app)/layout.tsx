import { AppShell } from "@/components/shell/AppShell";
import { getShellUser } from "@/lib/shell/get-shell-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getShellUser();

  return <AppShell user={user}>{children}</AppShell>;
}
