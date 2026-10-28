"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileCheck2 } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { useHomeCurrency } from "@/components/money/useHomeCurrency";

// Finance › 1099 contractor totals (task 1150 part 1): who you paid this year and who may need a 1099-NEC.
// A 1099 is a US form, so only US-dollar payments count here (task 1520); Canadian-dollar ones are left out.
type Payee = { key: string; name: string; total: number; count: number; contractor: boolean; w9: boolean; card: boolean; note: string; needs1099: boolean; otherTotal?: number };
type Data = { year: number; threshold: number; thresholdCheck: boolean; payees: Payee[]; unnamed: { total: number; count: number } };
// `total` is US dollars only; someone paid only in Canadian dollars (otherTotal) is left off the list.
const isUsd = (p: Payee) => p.total > 0 || !(p.otherTotal && p.otherTotal > 0);

export default function Contractors1099() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [d, setD] = useState<Data | null>(null);
  const [onlyContractors, setOnlyContractors] = useState(false);
  const [msg, setMsg] = useState("");
  const { currency: home, canChoose } = useHomeCurrency();
  const usd = (n: number) => formatMoney(n, "usd", { home, cents: true });

  const load = useCallback(async (y: number) => {
    const r = await fetch(`/api/finance/contractors?year=${y}`, { cache: "no-store" });
    if (r.ok) {
      const x = (await r.json()) as Data;
      setD({ ...x, payees: (x.payees ?? []).filter(isUsd) });
    }
  }, []);
  useEffect(() => {
    void load(year);
  }, [year, load]);

  async function mark(p: Payee, patch: Partial<Payee>) {
    const next = { ...p, ...patch };
    setD((x) => (x ? { ...x, payees: x.payees.map((y) => (y.key === p.key ? { ...next, needs1099: next.contractor && !next.card && next.total >= x.threshold } : y)) } : x));
    const r = await fetch("/api/finance/contractors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: next.name, contractor: next.contractor, w9: next.w9, card: next.card, note: next.note }) });
    if (!r.ok) setMsg("That didn't save. Please try again.");
  }

  function download() {
    if (!d) return;
    const rows = [["Payee", "Total paid", "Payments", "Contractor", "W-9 on file", "Paid only by card or PayPal", "Needs a 1099-NEC", "Note"], ...d.payees.filter((p) => !onlyContractors || p.contractor).map((p) => [p.name, p.total.toFixed(2), String(p.count), p.contractor ? "yes" : "no", p.w9 ? "yes" : "no", p.card ? "yes" : "no", p.needs1099 ? "yes" : "no", p.note])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `1099-contractor-totals-${d.year}.csv`;
    a.click();
  }

  const shown = d ? d.payees.filter((p) => !onlyContractors || p.contractor) : [];
  const need = d ? d.payees.filter((p) => p.needs1099) : [];
  const missingW9 = need.filter((p) => !p.w9);

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <Link href="/finance/tax" className="mb-3 inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline"><ArrowLeft className="h-4 w-4" /> Tax readiness</Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2E7C83]/15"><FileCheck2 className="h-6 w-6 text-[#2E7C83]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">1099 contractor totals</h1>
            <p className="text-sm text-[#7b6b8d]">Everyone you paid this year, from the &quot;Paid to&quot; on your expenses. Mark your contractors and the Suite shows who may need a 1099-NEC.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white px-3 text-sm dark:bg-[#1a2b4a]/20" value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">
            {Array.from({ length: Math.max(1, thisYear - 2023) }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={download} disabled={!d} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#1a2b4a]/20 px-3 text-sm font-medium hover:bg-[#1a2b4a]/5"><Download className="h-4 w-4" />Download for my accountant</button>
        </div>
      </div>

      {!d ? <p className="text-sm text-[#7b6b8d]">Loading…</p> : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40"><p className="text-sm text-[#7b6b8d]">May need a 1099-NEC</p><p className="text-2xl font-bold">{need.length}</p><p className="text-xs text-[#7b6b8d]">contractors paid {usd(d.threshold)} or more in {d.year}{d.thresholdCheck ? " (check this year's amount with your accountant)" : ""}</p></div>
            <div className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40"><p className="text-sm text-[#7b6b8d]">Still need a W-9</p><p className="text-2xl font-bold" style={{ color: missingW9.length ? "#b06a5a" : undefined }}>{missingW9.length}</p><p className="text-xs text-[#7b6b8d]">ask for it before you file (by January 31)</p></div>
            <div className="rounded-xl border border-[#1a2b4a]/10 bg-white p-4 dark:bg-[#1a2b4a]/40"><p className="text-sm text-[#7b6b8d]">Expenses with no &quot;Paid to&quot;</p><p className="text-2xl font-bold">{usd(d.unnamed.total)}</p><p className="text-xs text-[#7b6b8d]">{d.unnamed.count} expense{d.unnamed.count === 1 ? "" : "s"}. Add who you paid on the Expenses page so they count here.</p></div>
          </div>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyContractors} onChange={(e) => setOnlyContractors(e.target.checked)} />Show only contractors</label>
          {msg && <p className="text-sm text-red-700">{msg}</p>}

          {!shown.length ? <p className="text-sm text-[#7b6b8d]">No one yet. Expenses with a &quot;Paid to&quot; name show up here.</p> : (
            <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/40">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-[#7b6b8d]">
                  <tr><th className="p-3">Paid to</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Contractor</th><th className="p-3 text-center">W-9 on file</th><th className="p-3 text-center">Only by card / PayPal</th><th className="p-3">1099-NEC</th></tr>
                </thead>
                <tbody className="divide-y divide-[#1a2b4a]/10">
                  {shown.map((p) => (
                    <tr key={p.key} className={p.needs1099 ? "bg-[#c9a227]/10" : ""}>
                      <td className="p-3"><span className="font-semibold">{p.name}</span> <span className="text-xs text-[#7b6b8d]">· {p.count} payment{p.count === 1 ? "" : "s"}</span></td>
                      <td className="p-3 text-right tabular-nums">{usd(p.total)}</td>
                      <td className="p-3 text-center"><input type="checkbox" aria-label={`${p.name} is a contractor`} checked={p.contractor} onChange={(e) => void mark(p, { contractor: e.target.checked })} /></td>
                      <td className="p-3 text-center"><input type="checkbox" aria-label={`W-9 on file for ${p.name}`} checked={p.w9} disabled={!p.contractor} onChange={(e) => void mark(p, { w9: e.target.checked })} /></td>
                      <td className="p-3 text-center"><input type="checkbox" aria-label={`${p.name} was paid only by card or PayPal`} checked={p.card} disabled={!p.contractor} onChange={(e) => void mark(p, { card: e.target.checked })} /></td>
                      <td className="p-3 text-xs">{!p.contractor ? "" : p.card ? "Not from you (the card company reports it)" : p.needs1099 ? <span className="font-semibold text-[#8a5a00]">Likely needed{p.w9 ? "" : " · get their W-9"}</span> : `Under ${usd(d.threshold)}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-[#7b6b8d]">Contractors are people or businesses you paid for work who aren&apos;t your employees (most corporations don&apos;t get one). The reporting amount is {usd(600)} for payments made through 2025 and {usd(2000)} from 2026. This is a guide to bring to your accountant, not tax advice.</p>
          {(canChoose || home === "cad") && <p className="text-xs text-[#7b6b8d]">Amounts paid in Canadian dollars are not included.</p>}
        </div>
      )}
    </div>
  );
}
