"use client";

import { useEffect, useState } from "react";

type Key = "brain" | "soul" | "profit";
const PAGES: Record<Key, { href: string; label: string }> = {
  brain: { href: "/assessments/brain", label: "Continue to Brain Assessment" },
  soul: { href: "/assessments/soul", label: "Continue to Soul Assessment" },
  profit: { href: "/assessments/profit", label: "Continue to Profit Assessment" },
};
const ORDER: Key[] = ["brain", "soul", "profit"];

// Where to send someone who has just finished an assessment: the next one they haven't
// done yet (Brain, Soul, then Profit), or back to Set up Suite when all three are in.
export function useNextAssessment(current: Key): { href: string; label: string } {
  const [next, setNext] = useState<{ href: string; label: string }>({ href: "/setup", label: "Back to Set up Suite" });
  useEffect(() => {
    let live = true;
    fetch("/api/setup/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!live || !s?.assessments) return;
        const left = ORDER.find((k) => k !== current && !s.assessments[k]);
        setNext(left ? PAGES[left] : { href: "/setup", label: "Back to Set up Suite" });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [current]);
  return next;
}
