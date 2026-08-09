"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Kind } from "@/modules/worldbuild/domain/kind";
import { STORED_FACET_TYPES } from "@/modules/worldbuild/domain/facet-type";
import { createCodexEntryAction } from "@/modules/worldbuild/presentation/actions/codex.actions";
import { CodexEntryForm } from "@/app/studio/_components/codex/codex-entry-form";
import { CodexFormAlert } from "@/app/studio/_components/codex/codex-form-alert";
import {
  emptyFacetsForKind,
  formValuesToEntryPayload,
  type CodexFormValues,
} from "@/app/studio/_components/codex/codex-entry-form.types";
import { useAppShell } from "@/common/components/layouts/app-shell";
import { Button } from "@/common/components/ui/button";
import { Spinner } from "@/common/components/feedback/spinner";
import { CODEX_ENTRY_META_PANEL_ID } from "@/app/studio/create/constants";

type StudioManualCreateFormProps = {
  kinds: Kind[];
  initialKindSlug?: string;
};

function emptyValuesForKind(kind: Kind | null): CodexFormValues {
  const enabled = kind
    ? STORED_FACET_TYPES.filter((facetType) =>
        kind.facets.some(
          (facet) => facet.facetType === facetType && facet.enabled,
        ),
      )
    : [];

  return {
    title: "",
    slug: "",
    visibility: "private",
    sharedUserIds: [],
    facets: emptyFacetsForKind(kind?.slug ?? null, enabled),
    edges: [],
  };
}

function StudioManualCreateForm({
  kinds,
  initialKindSlug,
}: StudioManualCreateFormProps) {
  const router = useRouter();
  const { setPanelOpen } = useAppShell();
  const initialKind =
    kinds.find((kind) => kind.slug === initialKindSlug) ?? kinds[0] ?? null;

  const [kindSlug, setKindSlug] = useState(initialKind?.slug ?? "");
  const selectedKind = useMemo(
    () => kinds.find((kind) => kind.slug === kindSlug) ?? null,
    [kinds, kindSlug],
  );
  const [values, setValues] = useState<CodexFormValues>(() =>
    emptyValuesForKind(initialKind),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formDetails, setFormDetails] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function handleKindChange(nextSlug: string) {
    const nextKind = kinds.find((kind) => kind.slug === nextSlug) ?? null;
    setKindSlug(nextSlug);
    setValues((prev) => ({
      ...emptyValuesForKind(nextKind),
      title: prev.title,
      slug: prev.slug,
      visibility: prev.visibility,
      sharedUserIds: prev.sharedUserIds,
    }));
  }

  function clearError() {
    setFormError(null);
    setFormDetails([]);
  }

  function handleSubmit() {
    if (!selectedKind) {
      setFormError("Escolha o tipo da entrada.");
      setFormDetails([]);
      toast.error("Escolha o tipo da entrada.");
      return;
    }

    clearError();
    startTransition(async () => {
      const result = await createCodexEntryAction(
        selectedKind.slug,
        formValuesToEntryPayload(values),
      );
      if (!result.ok) {
        const message = result.message ?? "Não foi possível criar.";
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
      if (result.entryId) {
        router.push(`/studio/entries/${result.entryId}`);
        router.refresh();
      }
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
        kind={selectedKind}
        kinds={kinds}
        values={values}
        showVisibility
        autoSlugFromTitle
        editorKey={`create-${kindSlug || "none"}`}
        onKindChange={handleKindChange}
        onChange={setValues}
        toolbarActions={
          <Button
            type="button"
            size="sm"
            disabled={pending || !selectedKind}
            onClick={handleSubmit}
          >
            {pending ? <Spinner size="sm" /> : null}
            Criar
          </Button>
        }
      />
    </div>
  );
}

export { StudioManualCreateForm };
