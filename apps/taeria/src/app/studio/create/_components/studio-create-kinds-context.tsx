"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Kind } from "@/modules/worldbuild/domain/kind";

const StudioCreateKindsContext = createContext<Kind[] | null>(null);

type StudioCreateKindsProviderProps = {
  kinds: Kind[];
  children: ReactNode;
};

function StudioCreateKindsProvider({
  kinds,
  children,
}: StudioCreateKindsProviderProps) {
  return (
    <StudioCreateKindsContext.Provider value={kinds}>
      {children}
    </StudioCreateKindsContext.Provider>
  );
}

function useStudioCreateKinds() {
  const kinds = useContext(StudioCreateKindsContext);
  if (!kinds) {
    throw new Error(
      "useStudioCreateKinds deve ser usado dentro de StudioCreateKindsProvider.",
    );
  }
  return kinds;
}

export { StudioCreateKindsProvider, useStudioCreateKinds };
