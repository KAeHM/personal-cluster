"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import type { Kind } from "@/modules/worldbuild/domain/kind";
import { updateCodexEntryAction } from "@/modules/worldbuild/presentation/actions/codex.actions";
import { CodexEntryForm } from "@/app/studio/_components/codex/codex-entry-form";
import { CodexFormAlert } from "@/app/studio/_components/codex/codex-form-alert";
import {
  entryToFormValues,
  formValuesToEntryPayload,
  type CodexFormValues,
} from "@/app/studio/_components/codex/codex-entry-form.types";
import type {
  CodexEdgeWithTarget,
  CodexEntry,
} from "@/modules/worldbuild/domain/codex-entry";
import { useAppShell } from "@/common/components/layouts/app-shell";
import { Button } from "@/common/components/ui/button";
import { Spinner } from "@/common/components/feedback/spinner";
import { CODEX_ENTRY_META_PANEL_ID } from "@/app/studio/create/constants";

type CodexEntryEditFormProps = {
  entry: CodexEntry;
  kind: Kind;
  edgesWithTargets: CodexEdgeWithTarget[];
};

function CodexEntryEditForm({
  entry,
  kind,
  edgesWithTargets,
}: CodexEntryEditFormProps) {
  const router = useRouter();
  const { setPanelOpen } = useAppShell();
  const [values, setValues] = useState<CodexFormValues>(() =>
    entryToFormValues(entry, edgesWithTargets),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formDetails, setFormDetails] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function clearError() {
    setFormError(null);
    setFormDetails([]);
  }

  function handleSubmit() {
    clearError();
    startTransition(async () => {
      const result = await updateCodexEntryAction(
        entry.id,
        formValuesToEntryPayload(values),
      );
      if (!result.ok) {
        const message = result.message ?? "Não foi possível salvar.";
        const details = result.details ?? [];
        setFormError(message);
        setFormDetails(details);
        toast.error(message, {
          description: details.length > 0 ? details.join(" · ") : undefined,
          duration: 10_000,
        });
        setPanelOpen(CODEX_ENTRY_META_PANEL_ID, true);
        return;
      }
      router.push(`/studio/entries/${entry.id}`);
      router.refresh();
    });
  }

  return (
    <div className="w-full px-4 py-6 sm:px-8 lg:px-12">
      {formError ? (
        <CodexFormAlert
          message={formError}
          details={formDetails}
          onDismiss={clearError}
        />
      ) : null}

      <CodexEntryForm
        layout="page"
        kind={kind}
        values={values}
        showVisibility
        editorKey={entry.id}
        onChange={setValues}
        toolbarLeading={
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href={`/studio/entries/${entry.id}`}>
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Link>
          </Button>
        }
        toolbarActions={
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={handleSubmit}
          >
            {pending ? <Spinner size="sm" /> : null}
            Salvar
          </Button>
        }
        panelFooter={
          <div className="border-border -mx-4 border-t px-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => router.push(`/studio/entries/${entry.id}`)}
            >
              Cancelar
            </Button>
          </div>
        }
      />
    </div>
  );
}

export { CodexEntryEditForm };
