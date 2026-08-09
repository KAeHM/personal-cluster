"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { PanelRightIcon } from "lucide-react";

import { Button } from "@/common/components/ui/button";
import { cn } from "@/common/utils/cn";
import { STUDIO_TOOLBAR_END_SLOT_ID } from "../constants";
import { useStudioCreateUi } from "./studio-create-ui-context";

function subscribeToToolbarSlot() {
  return () => {};
}

function getToolbarEndSlot(): HTMLElement | null {
  return document.getElementById(STUDIO_TOOLBAR_END_SLOT_ID);
}

function useToolbarEndSlot() {
  return useSyncExternalStore(
    subscribeToToolbarSlot,
    getToolbarEndSlot,
    () => null,
  );
}

function StudioCreateToolbarPortal() {
  const { draftPanelOpen, toggleDraftPanel } = useStudioCreateUi();
  const slot = useToolbarEndSlot();

  if (!slot) {
    return null;
  }

  return createPortal(
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "gap-2",
        draftPanelOpen && "bg-accent text-accent-foreground",
      )}
      aria-expanded={draftPanelOpen}
      aria-controls="studio-create-draft-panel"
      onClick={toggleDraftPanel}
    >
      <PanelRightIcon className="size-4" />
      Rascunho
    </Button>,
    slot,
  );
}

export { StudioCreateToolbarPortal };
