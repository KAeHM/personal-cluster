"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore, type ReactNode } from "react";

import {
  CODEX_ENTRY_META_SLOT_ID,
  STUDIO_TOOLBAR_END_SLOT_ID,
} from "@/app/studio/create/constants";

function subscribeNoop() {
  return () => {};
}

function useDomSlot(id: string): HTMLElement | null {
  return useSyncExternalStore(
    subscribeNoop,
    () => document.getElementById(id),
    () => null,
  );
}

function StudioToolbarPortal({ children }: { children: ReactNode }) {
  const slot = useDomSlot(STUDIO_TOOLBAR_END_SLOT_ID);
  if (!slot) {
    return null;
  }
  return createPortal(children, slot);
}

function CodexEntryMetaPortal({ children }: { children: ReactNode }) {
  const slot = useDomSlot(CODEX_ENTRY_META_SLOT_ID);
  if (!slot) {
    return null;
  }
  return createPortal(children, slot);
}

export { CodexEntryMetaPortal, StudioToolbarPortal };
