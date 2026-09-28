"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, AlertCircle } from "lucide-react";
import type { PipelineSummary } from "@/lib/sales/pipeline";
import { formatMoney } from "@/lib/sales/offers";

// Executive Home: Pipeline & Offers at a glance, from the client's own deals board and offers.
export default function PipelineCard() {
  const [s, setS] = useState<PipelineSummary | null | undefined>(undefined);
  useEffect(() => {
    fetch("/api/pipeline/summary", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setS(d?.summary ?? null))
      .catch(() => setS(null));
  }, []);

  const empty = s && s.openDeals === 0 && s.wonThisMonth.count === 0 && s.activeOffers === 0;
  const openStages = s ? s.byStage.filter((b) => b.kind === "open") : [];
  const maxCount = Math.max(1, ...openStages.map((b) => b.count));

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-gray-200/60 bg-[#FFFFFF] shadow-sm">
      <div className="flex items-center justify-between gap-2 px-6 pb-3 pt-5">
        <h3 className="font-serif text-base text-indigo-900">Pipeline &amp; Offers</h3>
        <Link href="/sales/pipeline" className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2E7C83] hover:underline">
          Open board <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="px-6 pb-5">
        {s === undefined ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : !s || empty ? (
          <div className="text-sm text-gray-500">
            <p>Add your offers and the deals you&rsquo;re working, and your pipeline shows up here.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/sales/offers" className="font-medium text-[#2E7C83] hover:underline">Add an offer</Link>
              <Link href="/sales/pipeline" className="font-medium text-[#2E7C83] hover:underline">Add a deal</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Open</p>
                <p className="text-lg font-semibold tabular-nums text-indigo-900">{formatMoney(s.openValue) || "$0"}</p>
                <p className="text-[11px] text-gray-400">{s.openDeals} deal{s.openDeals === 1 ? "" : "s"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Weighted</p>
                <p className="text-lg font-semibold tabular-nums text-indigo-900">{formatMoney(s.weightedValue) || "$0"}</p>
                <p className="text-[11px] text-gray-400">by probability</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Won this month</p>
                <p className="text-lg font-semibold tabular-nums text-[#2f7d55]">{formatMoney(s.wonThisMonth.value) || "$0"}</p>
                <p className="text-[11px] text-gray-400">{s.wonThisMonth.count} deal{s.wonThisMonth.count === 1 ? "" : "s"}</p>
              </div>
            </div>
            {openStages.length > 0 && (
              <ul className="mt-4 space-y-1.5" aria-label="Deals by stage">
                {openStages.map((b) => (
                  <li key={b.id} className="grid grid-cols-[110px_1fr_auto] items-center gap-2 text-xs">
                    <span className="truncate text-gray-500">{b.name}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-gray-100"><span className="block h-full rounded-full bg-[#6A9EA4]" style={{ width: `${(b.count / maxCount) * 100}%` }} /></span>
                    <span className="tabular-nums text-gray-500">{b.count}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
              {s.topOffer ? (
                <p>Top offer in the pipeline: <Link href="/sales/offers" className="font-medium text-indigo-900 hover:underline">{s.topOffer.name}</Link> ({formatMoney(s.topOffer.value)} across {s.topOffer.count} deal{s.topOffer.count === 1 ? "" : "s"})</p>
              ) : (
                <p>{s.activeOffers} active offer{s.activeOffers === 1 ? "" : "s"}. <Link href="/sales/offers" className="text-[#2E7C83] hover:underline">Manage offers</Link></p>
              )}
              {s.toMove.length > 0 && (
                <p className="flex items-center gap-1 font-medium text-[#8a6a15]"><AlertCircle className="h-3.5 w-3.5" /> {s.toMove.length} deal{s.toMove.length === 1 ? "" : "s"} to move today, listed in <Link href="/daily-compass" className="underline">Daily Compass</Link></p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
