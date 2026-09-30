"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import type { AffiliateReport } from "@/lib/affiliates";
import ReportView, { monthLabel } from "./ReportView";

// Month picker + report + CSV, reading from `endpoint` (owner: /api/affiliates/report,
// affiliate: /api/affiliates/mine) with `params` (e.g. affiliateId).
const shift = (m: string, by: number) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1 + by, 1)).toISOString().slice(0, 7);
};

export default function MonthlyReport({ endpoint, params }: { endpoint: string; params: Record<string, string> }) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const [r, setR] = useState<AffiliateReport | null>(null);
  const key = JSON.stringify(params);
  useEffect(() => {
    setR(null);
    const q = new URLSearchParams({ ...params, month });
    fetch(`${endpoint}?${q}`, { cache: "no-store" })
      .then((x) => x.json())
      .then((d) => setR(d.report ?? null))
      .catch(() => setR(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, key, month]);
  const csv = `${endpoint}?${new URLSearchParams({ ...params, month, format: "csv" })}`;
  const btn = "rounded-full border border-[#1a2b4a]/15 px-3 py-1.5 text-sm text-[#1a2b4a] hover:bg-[#1a2b4a]/5 dark:text-[#F8F5F0]";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{monthLabel(month)} report</p>
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => setMonth(shift(month, -1))}>← {monthLabel(shift(month, -1)).split(" ")[0]}</button>
          {month < thisMonth && <button className={btn} onClick={() => setMonth(shift(month, 1))}>{monthLabel(shift(month, 1)).split(" ")[0]} →</button>}
          <a href={csv} className="inline-flex items-center gap-1 rounded-full bg-[#2E7C83] px-4 py-1.5 text-sm font-semibold text-white"><Download className="w-4 h-4" /> Download (CSV)</a>
        </div>
      </div>
      {r ? <ReportView r={r} /> : <p className="text-sm text-[#7a8a99]">Loading…</p>}
    </div>
  );
}
