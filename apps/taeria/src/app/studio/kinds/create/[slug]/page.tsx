import { notFound } from "next/navigation";

import { getKindBySlug, listKinds } from "@/modules/worldbuild";
import { StudioCreateLayout } from "@/app/studio/create/_components/studio-create-layout";

type KindCreatePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function KindCreatePage({ params }: KindCreatePageProps) {
  const { slug } = await params;

  let kind;
  try {
    kind = await getKindBySlug(slug);
  } catch {
    notFound();
  }

  const kinds = await listKinds();

  return (
    <StudioCreateLayout
      kinds={kinds}
      initialKindSlug={kind.slug}
      breadcrumbLabel={kind.name}
      welcomeMessage={`Assistente para criar **${kind.name}**. Descreva a entidade — título, lore, mecânicas ou relações.`}
    />
  );
}
