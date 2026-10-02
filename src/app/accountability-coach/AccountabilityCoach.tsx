"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, HeartHandshake } from "lucide-react";
import AccountabilityWorkspace from "@/components/accountability/AccountabilityWorkspace";

interface Row { id: string; client: string; partner: string; status: string; clientOpen: number; clientDone: number; clientOverdue: number; partnerOpen: number }

export default function AccountabilityCoach() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/accountability/coach", { cache: "no-store" }).then((r) => r.json()).then((d) => setRows(d.partnerships ?? [])).catch(() => setRows([]));
  }, []);
  const cur = rows?.find((r) => r.id === sel);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c0632f] to-[#1a2b4a]"><HeartHandshake className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Accountability Partners</h1>
          <p className="text-[#7a8a99]">Only the partnerships clients chose to share with you. Read-only; only you see this page.</p>
        </div>
      </div>
      {sel && cur ? (
        <div className="space-y-4">
          <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E7C83] hover:underline" onClick={() => setSel(null)}><ArrowLeft className="h-4 w-4" /> All partnerships</button>
          <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{cur.client} &amp; {cur.partner}</h2>
          <AccountabilityWorkspace key={sel} mode="coach" getUrl={`/api/accountability/coach?id=${sel}`} postUrl="/api/accountability/coach" />
        </div>
      ) : rows === null ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-6 text-sm text-[#5a6472] dark:bg-[#1a2b4a]/40">Nothing shared yet. A client turns this on from their own Accountability page (&ldquo;Let my coach see this&rdquo;).</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <button key={r.id} onClick={() => setSel(r.id)} className="rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 text-left hover:border-[#c9a227]/50 dark:bg-[#1a2b4a]/40">
              <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{r.client}</p>
              <p className="text-xs text-[#7a8a99]">with {r.partner} · {r.status}</p>
              <p className="mt-2 text-sm text-[#5a6472] dark:text-[#b8c2cf]"><b>{r.clientOpen}</b> open · <b className="text-[#2c6b3f]">{r.clientDone}</b> done{r.clientOverdue > 0 ? <> · <b className="text-[#b3422f]">{r.clientOverdue}</b> past date</> : null}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
