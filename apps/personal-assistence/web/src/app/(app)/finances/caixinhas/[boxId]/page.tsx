import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { BoxDetailContent } from "@/components/finances/BoxDetailContent";
import {
  getFinanceBoxDetailData,
  getFinancesListData,
} from "@/lib/finances/queries";
import { getShellUser } from "@/lib/shell/get-shell-user";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ boxId: string }>;
};

export default async function FinanceBoxDetailPage({ params }: Props) {
  noStore();

  const { boxId } = await params;
  const shellUser = await getShellUser();

  const [detail, listData] = await Promise.all([
    getFinanceBoxDetailData(shellUser.id, boxId),
    getFinancesListData(shellUser.id),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <BoxDetailContent
      initialData={detail}
      allBoxes={listData.boxes}
      categories={listData.categories}
    />
  );
}
