import { unstable_noStore as noStore } from "next/cache";

import { IncomeSourcesContent } from "@/components/finances/IncomeSourcesContent";
import { getFinanceSettings } from "@/modules/finances/application/queries";
import { getShellUser } from "@/lib/shell/get-shell-user";

export const dynamic = "force-dynamic";

export default async function IncomeSourcesPage() {
  noStore();

  const shellUser = await getShellUser();
  const data = await getFinanceSettings(shellUser.id);

  return (
    <IncomeSourcesContent
      initialData={{
        settings: {
          monthlyFixedIncomeCents: data.settings.monthlyFixedIncomeCents,
        },
        incomeSources: data.incomeSources.map((source) => ({
          id: source.id,
          name: source.name,
          type: source.type,
          expectedAmountCents: source.expectedAmountCents,
          isActive: source.isActive,
        })),
        computedFixedIncomeCents: data.computedFixedIncomeCents,
      }}
    />
  );
}
