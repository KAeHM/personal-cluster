import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/common/components/patterns/page-header";

export default function StudioPage() {
  return (
    <div className="p-6">
      <PageHeader>
        <PageHeaderTitle>Studio</PageHeaderTitle>
        <PageHeaderDescription>
          Área de trabalho do Taeria — conteúdo em breve.
        </PageHeaderDescription>
      </PageHeader>
    </div>
  );
}
