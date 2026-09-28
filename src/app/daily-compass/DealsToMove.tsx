"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, AlertCircle, Clock, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { PipelineSummary } from "@/lib/sales/pipeline";
import { STALE_DAYS } from "@/lib/sales/pipeline";
import { formatMoney } from "@/lib/sales/offers";

// Daily Compass: deals whose next step is due or overdue, or that haven't moved in two weeks.
// Each one opens straight onto its card on the Pipeline.
export function DealsToMove() {
  const [s, setS] = useState<PipelineSummary | null | undefined>(undefined);
  useEffect(() => {
    fetch("/api/pipeline/summary", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setS(d?.summary ?? null))
      .catch(() => setS(null));
  }, []);
  if (s === undefined) return null;
  const list = s?.toMove ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#c9a227]" />
          Deals to move today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.length === 0 ? (
          <p className="text-sm text-[#7b6b8d]">
            {s && s.openDeals > 0 ? "Every deal has a next step on track." : "No open deals yet."}{" "}
            <Link href="/sales/pipeline" className="text-[#2E7C83] hover:underline">Open the Pipeline</Link>
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {list.map((d) => (
                <li key={d.id}>
                  <Link href={`/sales/pipeline?deal=${d.id}`} className="block rounded-lg border border-[#1a2b4a]/10 p-2.5 hover:border-[#c9a227] dark:border-white/10">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{d.contactName}</span>
                      {d.value !== null && <span className="shrink-0 text-xs tabular-nums text-[#7b6b8d]">{formatMoney(d.value)}</span>}
                    </div>
                    <p className={`mt-0.5 flex items-start gap-1 text-xs ${d.reason === "overdue" ? "font-semibold text-[#b03a2e]" : d.reason === "due" ? "font-semibold text-[#8a6a15]" : "text-[#7b6b8d]"}`}>
                      {d.reason === "overdue" ? <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" /> : d.reason === "due" ? <Clock className="mt-px h-3.5 w-3.5 shrink-0" /> : <Hourglass className="mt-px h-3.5 w-3.5 shrink-0" />}
                      <span>
                        {d.reason === "stale" ? `No movement in ${STALE_DAYS}+ days · ${d.stage}` : `${d.nextStep || "Next step"} · ${d.reason === "due" ? "today" : "overdue"}`}
                      </span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/sales/pipeline" className="block text-center text-sm text-[#2E7C83] hover:underline">Open the Pipeline</Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
