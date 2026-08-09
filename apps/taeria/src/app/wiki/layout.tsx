import { redirect } from "next/navigation";

import { isAppError } from "@/common/errors";
import { requireAuth } from "@/modules/auth";
import { WikiShell } from "./_components/wiki-shell";

export default async function WikiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session;
  try {
    session = await requireAuth();
  } catch (error) {
    if (isAppError(error) && error.code === "AUTH_UNAUTHORIZED") {
      redirect("/login");
    }
    throw error;
  }

  return (
    <div className="h-full min-h-0">
      <WikiShell user={session.user}>{children}</WikiShell>
    </div>
  );
}
