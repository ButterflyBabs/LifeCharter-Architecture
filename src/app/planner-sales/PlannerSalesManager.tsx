"use client";

import { useEffect, useState } from "react";

interface Sale {
  id: string;
  orderId: string;
  product: string;
  amount: number;
  free: boolean;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
}
interface Coupon {
  id: string;
  planner: string;
  plannerTitle: string;
  code: string | null;
  buyerName: string;
  email: string;
  createdAt: string;
  lastSentAt: string | null;
  redeemedAt: string | null;
}
interface Summary {
  revenue: number;
  paidOrders: number;
  freeDownloads: number;
  couponsGenerated: number;
  couponsRedeemed: number;
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1a2b4a]/10 dark:border-[#334060] bg-white dark:bg-[#1E2A48] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#7a8a99]">{label}</p>
      <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] tabular-nums">{value}</p>
    </div>
  );
}

export default function PlannerSalesManager() {
  const [data, setData] = useState<{ summary: Summary; sales: Sale[]; coupons: Coupon[] } | null>(null);
  const [tab, setTab] = useState<"sales" | "coupons">("sales");

  useEffect(() => {
    fetch("/api/planner-sales", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData({ summary: { revenue: 0, paidOrders: 0, freeDownloads: 0, couponsGenerated: 0, couponsRedeemed: 0 }, sales: [], coupons: [] }));
  }, []);

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Planner Sales</h1>
      <p className="text-[#7a8a99] mt-1 mb-6">
        Digital planner sales, free downloads and giveaway coupon codes — amilynnecarroll.com/planners. Paid orders also count as real
        income on your Finance pages, category &quot;Digital Planners&quot;.
      </p>

      {!data ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <Stat label="Revenue" value={usd(data.summary.revenue)} />
            <Stat label="Paid orders" value={String(data.summary.paidOrders)} />
            <Stat label="Free downloads" value={String(data.summary.freeDownloads)} />
            <Stat label="Coupons generated" value={String(data.summary.couponsGenerated)} />
            <Stat label="Coupons redeemed" value={String(data.summary.couponsRedeemed)} />
          </div>

          <div className="flex gap-2 mb-4 border-b border-[#1a2b4a]/10 dark:border-[#334060]">
            {(["sales", "coupons"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === t ? "border-[#c9a227] text-[#1a2b4a] dark:text-[#F8F5F0]" : "border-transparent text-[#7a8a99]"
                }`}
              >
                {t === "sales" ? "Sales & downloads" : "Coupon codes"}
              </button>
            ))}
          </div>

          {tab === "sales" ? (
            data.sales.length === 0 ? (
              <p className="text-sm text-[#7a8a99]">No Payhip orders yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10 dark:border-[#334060]">
                <table className="w-full text-sm">
                  <thead className="bg-[#1a2b4a]/[0.03] dark:bg-white/5 text-left text-[#7a8a99]">
                    <tr>
                      <th className="px-3 py-2 font-medium">When</th>
                      <th className="px-3 py-2 font-medium">Buyer</th>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Order</th>
                      <th className="px-3 py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((s) => (
                      <tr key={s.id} className="border-t border-[#1a2b4a]/10 dark:border-[#334060]">
                        <td className="px-3 py-2 whitespace-nowrap text-[#7a8a99]">{fmt(s.createdAt)}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{s.buyerName || "—"}</div>
                          <div className="text-xs text-[#7a8a99]">{s.buyerEmail}</div>
                        </td>
                        <td className="px-3 py-2 max-w-sm truncate" title={s.product}>
                          {s.product}
                        </td>
                        <td className="px-3 py-2 text-xs text-[#7a8a99]">{s.orderId}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {s.free ? (
                            <span className="rounded-full bg-[#2E7C83]/10 text-[#1F5E63] px-2 py-0.5 text-xs font-semibold">Free</span>
                          ) : (
                            usd(s.amount)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : data.coupons.length === 0 ? (
            <p className="text-sm text-[#7a8a99]">No giveaway coupons claimed yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10 dark:border-[#334060]">
              <table className="w-full text-sm">
                <thead className="bg-[#1a2b4a]/[0.03] dark:bg-white/5 text-left text-[#7a8a99]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Generated</th>
                    <th className="px-3 py-2 font-medium">Claimed by</th>
                    <th className="px-3 py-2 font-medium">Planner</th>
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Last sent</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coupons.map((c) => (
                    <tr key={c.id} className="border-t border-[#1a2b4a]/10 dark:border-[#334060]">
                      <td className="px-3 py-2 whitespace-nowrap text-[#7a8a99]">{fmt(c.createdAt)}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{c.buyerName || "—"}</div>
                        <div className="text-xs text-[#7a8a99]">{c.email}</div>
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate" title={c.plannerTitle}>
                        {c.plannerTitle}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{c.code ?? "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[#7a8a99]">{fmt(c.lastSentAt)}</td>
                      <td className="px-3 py-2">
                        {c.redeemedAt ? (
                          <span className="rounded-full bg-[#2E7C83]/10 text-[#1F5E63] px-2 py-0.5 text-xs font-semibold">
                            Redeemed {fmt(c.redeemedAt)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#c9a227]/15 text-[#1a2b4a] dark:text-[#F8F5F0] px-2 py-0.5 text-xs font-semibold">
                            Not used yet
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
