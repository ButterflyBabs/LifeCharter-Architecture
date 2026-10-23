"use client";

import { useEffect, useRef } from "react";

// Brings an assessment's saved answers back from the account when the page opens, so a client can start on
// one device and finish on another (or after clearing the browser). The answers on this device win: server
// answers only fill questions that are still empty here. The page's own autosave then keeps both in step.
export function useAssessmentRestore(
  type: "brain" | "soul" | "profit_architecture",
  setAnswers: (update: (prev: Record<string, string>) => Record<string, string>) => void,
  // Called once the account's answers are in, so the page can put the client where they left off.
  onRestored?: (fromServer: Record<string, string>) => void
) {
  const restored = useRef(onRestored);
  restored.current = onRestored;
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assessments/save?type=${type}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { responses?: { questionId: string; value: string }[] } | null) => {
        if (cancelled || !d?.responses?.length) return;
        const fromServer: Record<string, string> = {};
        for (const r of d.responses) if (r.questionId && r.value && r.value.trim() !== "") fromServer[r.questionId] = r.value;
        if (Object.keys(fromServer).length === 0) return;
        setAnswers((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const [id, v] of Object.entries(fromServer)) {
            if (!(next[id] ?? "").toString().trim()) {
              next[id] = v;
              changed = true;
            }
          }
          return changed ? next : prev;
        });
        restored.current?.(fromServer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [type, setAnswers]);
}
