"use client";

import { useCallback, useEffect, useState } from "react";

// With a business chosen in the header, money that belongs to no business yet stays out of its numbers.
// This offers to assign it all to the chosen business in one click.
export default function UnassignedBanner() {
  const [info, setInfo] = useState<{ business: { id: number; name: string } | null; entries: number; bills: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  const load = useCallback(() => {
    fetch("/api/finance/assign", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);
  useEffect(load, [load]);

  if (done) return <p role="status" className="mb-4 rounded-xl bg-[#2c6b3f]/10 px-4 py-3 text-sm text-[#1f4d2d] dark:text-[#8fd6a5]">{done}</p>;
  if (!info || !info.business || info.entries + info.bills === 0) return null;

  async function assign() {
    setBusy(true);
    try {
      const r = await fetch("/api/finance/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setDone(`Assigned ${d.entries} entr${d.entries === 1 ? "y" : "ies"} and ${d.bills} bill${d.bills === 1 ? "" : "s"} to ${d.business}. Refresh to see the new numbers.`);
      } else {
        setDone(d.error || "Couldn't assign them.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#c9a227]/10 px-4 py-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
      <p className="min-w-0 flex-1">
        {info.entries} money entr{info.entries === 1 ? "y" : "ies"} and {info.bills} bill{info.bills === 1 ? "" : "s"} don&apos;t belong to a business yet, so they&apos;re left out of {info.business.name}&apos;s numbers.
      </p>
      <button
        type="button"
        onClick={assign}
        disabled={busy}
        className="rounded-lg bg-[#1a2b4a] px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-[#c9a227] dark:text-[#1a2b4a]"
      >
        {busy ? "Assigning…" : `Assign them to ${info.business.name}`}
      </button>
    </div>
  );
}
