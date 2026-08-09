"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type StudioCreateUiContextValue = {
  draftPanelOpen: boolean;
  setDraftPanelOpen: (open: boolean) => void;
  toggleDraftPanel: () => void;
  fullscreenOpen: boolean;
  setFullscreenOpen: (open: boolean) => void;
  openFullscreen: () => void;
};

const StudioCreateUiContext = createContext<StudioCreateUiContextValue | null>(
  null,
);

function StudioCreateUiProvider({ children }: { children: ReactNode }) {
  const [draftPanelOpen, setDraftPanelOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const toggleDraftPanel = useCallback(() => {
    setDraftPanelOpen((current) => !current);
  }, []);

  const openFullscreen = useCallback(() => {
    setFullscreenOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      draftPanelOpen,
      setDraftPanelOpen,
      toggleDraftPanel,
      fullscreenOpen,
      setFullscreenOpen,
      openFullscreen,
    }),
    [draftPanelOpen, fullscreenOpen, toggleDraftPanel, openFullscreen],
  );

  return (
    <StudioCreateUiContext.Provider value={value}>
      {children}
    </StudioCreateUiContext.Provider>
  );
}

function useStudioCreateUi() {
  const context = useContext(StudioCreateUiContext);
  if (!context) {
    throw new Error(
      "useStudioCreateUi deve ser usado dentro de StudioCreateUiProvider.",
    );
  }
  return context;
}

export { StudioCreateUiProvider, useStudioCreateUi };
