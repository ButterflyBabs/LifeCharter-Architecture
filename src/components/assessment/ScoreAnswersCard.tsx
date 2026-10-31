"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const NAMES: Record<string, string> = { brain: "Brain", soul: "Soul" };

/** Shows only when a finished Brain or Soul has not been scored yet, usually because no AI key was connected at the time. */
export function ScoreAnswersCard() {
  const [pending, setPending] = useState<string[]>([]);
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = () =>
    fetch("/api/scoring/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setPending(d?.pending ?? []);
        setHasKey(d?.hasKey === true);
      })
      .catch(() => {});
  useEffect(() => {
    void load();
  }, []);

  const run = async () => {
    setBusy(true);
    setNote("");
    const r = await fetch("/api/scoring/recompute", { method: "POST" }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setBusy(false);
    if (!r || !r.ok) {
      setNote(d.error || "That did not work. Please try again.");
      return;
    }
    setNote("Your answers are scored.");
    await load();
  };

  if (!pending.length) return note ? <p className="mb-6 text-sm text-[#1F5E63]" role="status">{note}</p> : null;
  const names = pending.map((p) => NAMES[p]).join(" and ");
  return (
    <div className="mb-6 rounded-2xl border border-[#c9a227]/40 bg-card p-5 shadow-[0_10px_28px_rgba(31,43,58,0.12)]">
      <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your {names} answers still need scoring</p>
      <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">
        Part of your score comes from reading what you wrote. That part is waiting, so your scores are not complete yet. It uses your own AI key.
      </p>
      <div className="mt-3">
        {hasKey ? (
          <Button onClick={() => void run()} disabled={busy}>{busy ? "Scoring your answers…" : "Score my answers"}</Button>
        ) : (
          <Link href="/settings?tab=ai" className="text-sm font-semibold text-[#0F5B63] hover:underline dark:text-[#7fd0d6]">Add your AI key to score them</Link>
        )}
      </div>
      {note && <p className="mt-2 text-sm text-[#A4523C]" role="alert">{note}</p>}
    </div>
  );
}
