"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createCodexFromDraftAction } from "@/modules/worldbuild/presentation/actions/codex.actions";
import type { ContentFacetType } from "@/modules/worldbuild/domain/facet-type";
import { Button } from "@/common/components/ui/button";
import { Spinner } from "@/common/components/feedback/spinner";
import { CodexEntryForm } from "@/app/studio/_components/codex/codex-entry-form";
import { CodexFormAlert } from "@/app/studio/_components/codex/codex-form-alert";
import { draftToFormValues } from "@/app/studio/_components/codex/codex-entry-form.types";
import { useCodexDraft } from "./codex-draft-context";
import { useStudioCreateKinds } from "./studio-create-kinds-context";

type DraftPanelContentProps = {
  expanded?: boolean;
};

function DraftPanelContent({ expanded = false }: DraftPanelContentProps) {
  const { draft, setDraft, setLastEvent, sendMessage } = useCodexDraft();
  const kinds = useStudioCreateKinds();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formDetails, setFormDetails] = useState<string[]>([]);
  const router = useRouter();

  const selectedKind =
    kinds.find((kind) => kind.slug === draft.kindSlug) ?? null;

  const formValues = draftToFormValues(draft);

  function clearError() {
    setFormError(null);
    setFormDetails([]);
  }

  async function handleCreate() {
    clearError();
    startTransition(async () => {
      const result = await createCodexFromDraftAction(draft);
      if (!result.ok) {
        const message = result.message ?? "Não foi possível criar.";
        const details = result.details ?? [];
        setFormError(message);
        setFormDetails(details);
        toast.error(message, {
          description: details.length > 0 ? details.join(" · ") : undefined,
          duration: 10_000,
        });
        return;
      }
      if (result.entryId) {
        router.push(`/studio/entries/${result.entryId}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-col p-4">
      {formError ? (
        <CodexFormAlert
          message={formError}
          details={formDetails}
          onDismiss={clearError}
        />
      ) : null}
      <CodexEntryForm
        kind={selectedKind}
        values={formValues}
        expanded={expanded}
        onChange={(values) => {
          setDraft((prev) => ({
            ...prev,
            title: values.title,
            slug: values.slug,
            facets: values.facets,
            edges: values.edges,
          }));
          setLastEvent({ type: "user_edited_identity" });
        }}
        onRegenerateFacet={(facetType: ContentFacetType) => {
          sendMessage(`Regenerar ${facetType}`, {
            type: "regenerate_facet",
            facetType,
          });
        }}
      />

      <div className="mt-6">
        <Button
          type="button"
          className="w-full"
          disabled={pending || draft.meta.phase !== "ready"}
          onClick={handleCreate}
        >
          {pending ? <Spinner size="sm" /> : null}
          Criar entidade
        </Button>
      </div>
    </div>
  );
}

export { DraftPanelContent };
