import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";
import { KindForm } from "../_components/kind-form";

export default function NewKindPage() {
  return (
    <div className="p-6">
      <PageHeader className="mb-6">
        <PageHeaderTitle>Novo tipo de entidade</PageHeaderTitle>
        <PageHeaderDescription>
          Configure identidade, facetas e campos para um novo kind no codex.
        </PageHeaderDescription>
      </PageHeader>

      <KindForm mode="create" />
    </div>
  );
}
