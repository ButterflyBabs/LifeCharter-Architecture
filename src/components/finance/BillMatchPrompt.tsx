"use client";

import { useState } from "react";

export interface BillMatch {
  id: string;
  name: string;
  nextDue: string;
  amount: number | null;
}

const niceDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Shown right after an expense is saved that looks like an upcoming bill. One tap links the two (the bill rolls
 * to its next due date and nothing new is recorded), so the same money is not counted twice.
 */
export function BillMatchPrompt({ match, entryId, onClose }: { match: BillMatch; entryId: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  async function link() {
    setBusy(true);
    try {
      const r = await fetch("/api/finance/bills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: match.id, action: "settle", entryId }),
      });
      const d = await r.json().catch(() => ({}));
      setDone(r.ok ? `Linked. ${d.nextDue ? `${match.name} is next due ${niceDate(d.nextDue)}.` : `${match.name} is finished.`}` : d.error || "Couldn't link them.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="status" className="mb-4 rounded-xl border border-[#c9a227]/40 bg-[#c9a227]/[0.08] px-4 py-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
      {done ? (
        <div className="flex items-center justify-between gap-3">
          <span>{done}</span>
          <button onClick={onClose} className="text-xs underline">Close</button>
        </div>
      ) : (
        <>
          <p>
            This looks like your <strong>{match.name}</strong> bill due {niceDate(match.nextDue)}
            {match.amount ? ` (about $${Math.round(match.amount).toLocaleString("en-US")})` : ""}. Link them so it isn&apos;t counted twice and the bill moves to its next date?
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={link} disabled={busy} className="rounded-lg bg-[#1a2b4a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {busy ? "Linking…" : "Yes, link them"}
            </button>
            <button onClick={onClose} className="rounded-lg border border-[#1a2b4a]/20 px-3 py-1.5 text-xs">No, keep them separate</button>
          </div>
        </>
      )}
    </div>
  );
}
