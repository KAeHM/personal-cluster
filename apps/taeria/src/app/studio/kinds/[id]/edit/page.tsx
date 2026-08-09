import { notFound } from "next/navigation";

import { getKind } from "@/modules/worldbuild";
import { isAppError } from "@/common/errors";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderRow,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";
import { KindDeleteButton } from "../../_components/kind-delete-button";
import { kindToFormValues } from "../../_components/kind-form.mappers";
import { KindForm } from "../../_components/kind-form";

type EditKindPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditKindPage({ params }: EditKindPageProps) {
  const { id } = await params;

  let kind;
  try {
    kind = await getKind(id);
  } catch (error) {
    if (isAppError(error) && error.code === "KIND_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <div className="p-6">
      <PageHeader className="mb-6">
        <PageHeaderRow>
          <PageHeaderContent>
            <PageHeaderTitle>Editar &ldquo;{kind.name}&rdquo;</PageHeaderTitle>
            <PageHeaderDescription>
              {kind.isBuiltin
                ? "Tipo integrado do sistema — o identificador não pode ser alterado."
                : "Atualize facetas, campos e instruções de IA deste tipo."}
            </PageHeaderDescription>
          </PageHeaderContent>
          {!kind.isBuiltin ? (
            <PageHeaderActions>
              <KindDeleteButton kindId={kind.id} kindName={kind.name} />
            </PageHeaderActions>
          ) : null}
        </PageHeaderRow>
      </PageHeader>

      <KindForm
        mode="edit"
        kindId={kind.id}
        defaultValues={kindToFormValues(kind)}
        slugDisabled={kind.isBuiltin}
      />
    </div>
  );
}
