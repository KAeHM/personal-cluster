import { listKinds } from "@/modules/worldbuild";

import { StudioCreateLayout } from "./_components/studio-create-layout";

type StudioCreatePageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function StudioCreatePage({
  searchParams,
}: StudioCreatePageProps) {
  const { mode } = await searchParams;
  const kinds = await listKinds();

  return (
    <StudioCreateLayout
      kinds={kinds}
      initialMode={mode === "form" ? "form" : "assistant"}
    />
  );
}
