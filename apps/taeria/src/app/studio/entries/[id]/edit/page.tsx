import { notFound } from "next/navigation";

import { requireRole } from "@/modules/auth";
import { getCodexEntryDetail } from "@/modules/worldbuild";
import { CodexEntryEditForm } from "./_components/codex-entry-edit-form";

type EntryEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioEntryEditPage({
  params,
}: EntryEditPageProps) {
  await requireRole("admin");
  const { id } = await params;

  let detail;
  try {
    detail = await getCodexEntryDetail(id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <CodexEntryEditForm
        entry={detail.entry}
        kind={detail.kind}
        edgesWithTargets={detail.edgesWithTargets}
      />
    </div>
  );
}
