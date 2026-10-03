"use client";

import { useEffect, useState } from "react";

export type AssessmentStatus = { brain: boolean; soul: boolean; profit: boolean };
let pending: Promise<AssessmentStatus | null> | null = null;

// One status request shared by everything on a page that needs to know which of the three
// assessments are done. Forgotten after a few seconds so coming back shows fresh progress.
function loadStatus(): Promise<AssessmentStatus | null> {
  if (!pending) {
    pending = fetch("/api/setup/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => (s?.assessments ? { brain: !!s.assessments.brain, soul: !!s.assessments.soul, profit: !!s.assessments.profit } : null))
      .catch(() => null);
    setTimeout(() => {
      pending = null;
    }, 5000);
  }
  return pending;
}

// null until known (or if it could not be read).
export function useAssessmentStatus(): AssessmentStatus | null {
  const [status, setStatus] = useState<AssessmentStatus | null>(null);
  useEffect(() => {
    let live = true;
    void loadStatus().then((s) => {
      if (live) setStatus(s);
    });
    return () => {
      live = false;
    };
  }, []);
  return status;
}
