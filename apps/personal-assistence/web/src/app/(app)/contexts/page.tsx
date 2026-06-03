import { unstable_noStore as noStore } from "next/cache";

import { ContextsContent } from "@/components/contexts/ContextsContent";
import { getContextsData } from "@/lib/contexts/queries";
import { getShellUser } from "@/lib/shell/get-shell-user";

export const dynamic = "force-dynamic";

export default async function ContextsPage() {
  noStore();

  const shellUser = await getShellUser();
  const initialData = await getContextsData(shellUser.id);

  return <ContextsContent initialData={initialData} />;
}
