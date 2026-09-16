"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// Bridges the contact lookup panel to the New Client Onboarding form below
// it — they're both client components but sit on opposite sides of
// server-rendered content (the sales script, pricing grid) in page.tsx, so a
// shared context is simpler than lifting all of NewClientForm's state up.
//
// `version` increments on every selection so NewClientForm can tell "a new
// contact was picked" apart from "the same prefill object re-rendered" —
// comparing the loosely-typed prefill object itself would be fragile.

export interface ProspectPrefill {
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  biggestChallenge?: string;
}

interface ProspectContextValue {
  prefill: ProspectPrefill | null;
  version: number;
  setProspect: (data: ProspectPrefill) => void;
}

const ProspectContext = createContext<ProspectContextValue | null>(null);

export function ProspectProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<ProspectPrefill | null>(null);
  const [version, setVersion] = useState(0);

  const setProspect = useCallback((data: ProspectPrefill) => {
    setPrefill(data);
    setVersion((v) => v + 1);
  }, []);

  return (
    <ProspectContext.Provider value={{ prefill, version, setProspect }}>
      {children}
    </ProspectContext.Provider>
  );
}

export function useProspect(): ProspectContextValue {
  const ctx = useContext(ProspectContext);
  if (!ctx) throw new Error("useProspect must be used within a ProspectProvider");
  return ctx;
}
