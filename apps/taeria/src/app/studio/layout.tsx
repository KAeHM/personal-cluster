import { redirect } from "next/navigation";

import { isAppError } from "@/common/errors";
import { requireRole } from "@/modules/auth";
import { StudioShell } from "@/common/components/layouts/studio-shell";

export default async function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session;
  try {
    session = await requireRole("admin");
  } catch (error) {
    if (isAppError(error)) {
      if (error.code === "AUTH_UNAUTHORIZED") {
        redirect("/login");
      }
      if (error.code === "AUTH_FORBIDDEN") {
        redirect("/");
      }
    }

    throw error;
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <StudioShell user={session.user}>{children}</StudioShell>
    </div>
  );
}
