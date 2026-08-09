import { unstable_noStore as noStore } from "next/cache";

import { FinancesOverview } from "@/components/finances/FinancesOverview";
import {
  getFinancesListData,
  getFinancesOverviewData,
} from "@/lib/finances/queries";
import { listIncomeSources } from "@/modules/finances/application/queries";
import { getShellUser } from "@/lib/shell/get-shell-user";

export const dynamic = "force-dynamic";

export default async function FinancesPage() {
  noStore();

  const shellUser = await getShellUser();
  const [initialData, listData, sources] = await Promise.all([
    getFinancesOverviewData(shellUser.id, shellUser.timezone),
    getFinancesListData(shellUser.id),
    listIncomeSources(shellUser.id),
  ]);

  return (
    <FinancesOverview
      initialData={initialData}
      categories={listData.categories}
      incomeSources={sources.map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        expectedAmountCents: source.expectedAmountCents,
        isActive: source.isActive,
      }))}
    />
  );
}
