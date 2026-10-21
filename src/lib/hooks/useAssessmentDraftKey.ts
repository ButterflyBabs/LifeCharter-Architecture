"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The browser-backup key for an assessment draft, one per signed-in account, so two people on one computer never see
// each other's half-finished answers (Brain and Soul used one shared key per browser; Profit already scoped its own).
// The first account to open the page after this change adopts any draft already under the old shared key, so nobody
// loses work in progress; the old key is then removed. When the account cannot be read (signed out, offline), the old
// shared key is used as before. Returns null until the key is known: the page loads and saves nothing until then.
export function useAssessmentDraftKey(base: "brain-assessment" | "soul-assessment"): string | null {
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const settle = (k: string) => {
      if (!cancelled) setKey(k);
    };
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) => {
        const id = data.user?.id;
        if (!id) return settle(base);
        const k = `${base}:${id}`;
        try {
          const legacy = localStorage.getItem(base);
          if (legacy && !localStorage.getItem(k)) localStorage.setItem(k, legacy);
          if (legacy) localStorage.removeItem(base);
        } catch {
          /* the device refuses storage: the account save still works */
        }
        settle(k);
      })
      .catch(() => settle(base));
    return () => {
      cancelled = true;
    };
  }, [base]);
  return key;
}
