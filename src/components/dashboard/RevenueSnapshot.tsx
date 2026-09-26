"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, ShoppingCart, Target } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with recharts
const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const Legend = dynamic(
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <div className="h-[140px] flex items-center justify-center">
      <div className="flex gap-2">
        <div className="w-8 h-24 bg-[#e8e4f0]/30 rounded-t animate-pulse" />
        <div className="w-8 h-32 bg-[#e8e4f0]/30 rounded-t animate-pulse" />
        <div className="w-8 h-28 bg-[#e8e4f0]/30 rounded-t animate-pulse" />
        <div className="w-8 h-36 bg-[#e8e4f0]/30 rounded-t animate-pulse" />
      </div>
    </div>
  );
}

interface Snapshot {
  hasData: boolean;
  months: { month: string; income: number; expense: number }[];
  kpis: {
    monthIncome: number; monthIncomeChangePct: number | null; monthNet: number; monthMarginPct: number | null;
    avgDealSize: number | null; wonCount: number; conversionPct: number | null; contacted: number;
  } | null;
}

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

// Revenue Snapshot — this client's own income, expenses and sales results. It
// shows a dash where there's nothing recorded yet; nothing is made up.
export function RevenueSnapshot() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch(`/api/revenue-snapshot?tz=${encodeURIComponent(tz)}&ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const k = data?.kpis;
  const kpis = [
    {
      label: "Revenue this month", icon: DollarSign,
      value: k && data?.hasData ? usd(k.monthIncome) : "—",
      change: k?.monthIncomeChangePct ?? null, note: k?.monthIncomeChangePct == null && data?.hasData ? "nothing to compare yet" : "vs same days last month",
    },
    {
      label: "Net this month", icon: PiggyBank,
      value: k && data?.hasData ? usd(k.monthNet) : "—",
      change: null, note: k?.monthMarginPct != null ? `${k.monthMarginPct}% margin` : "income minus expenses",
    },
    {
      label: "Avg deal size", icon: ShoppingCart,
      value: k?.avgDealSize != null ? usd(k.avgDealSize) : "—",
      change: null, note: k?.wonCount ? `${k.wonCount} won deal${k.wonCount === 1 ? "" : "s"}` : "mark deals won in Sales Activities",
    },
    {
      label: "Win rate", icon: Target,
      value: k?.conversionPct != null ? `${k.conversionPct}%` : "—",
      change: null, note: k?.contacted ? `won of ${k.contacted} contacted` : "logged in Sales Activities",
    },
  ];

  return (
    <Card className="h-full border-[#c9a227]/30">
      <CardHeader>
        <CardTitle>Revenue Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {failed ? (
          <p className="text-sm text-[#7a8a99]">Couldn&apos;t load your revenue right now.</p>
        ) : !data ? (
          <ChartSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 mb-6">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                const up = (kpi.change ?? 0) >= 0;
                const TrendIcon = up ? TrendingUp : TrendingDown;
                return (
                  <div key={kpi.label} className="p-3 rounded-xl bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-[#7b6b8d] dark:text-[#e8e4f0] flex-shrink-0" />
                      <span className="text-xs text-[#7a8a99]">{kpi.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{kpi.value}</span>
                      {kpi.change !== null && (
                        <span className={`text-xs flex items-center gap-0.5 ${up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          <TrendIcon className="w-3 h-3" />
                          {up ? "+" : ""}{kpi.change}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7a8a99] mt-0.5">{kpi.note}</p>
                  </div>
                );
              })}
            </div>

            {data.hasData ? (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.months} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fill: "#7b6b8d", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: "#7b6b8d", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => (Number(value) >= 1000 ? `$${Math.round(Number(value) / 100) / 10}k` : `$${value}`)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#F8F5F0", border: "1px solid #c9a227", borderRadius: "8px" }}
                      labelStyle={{ color: "#1a2b4a" }}
                      formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === "income" ? "Income" : "Expenses"]}
                    />
                    <Legend formatter={(v) => (v === "income" ? "Income" : "Expenses")} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="income" fill="#7b6b8d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#4a9b9b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#1a2b4a]/20 p-5 text-center">
                <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">No income or expenses recorded yet.</p>
                <p className="text-xs text-[#7a8a99] mt-1 mb-3">Add what comes in and goes out and this card fills in with your last six months.</p>
                <Link href="/finance/income" className="text-sm font-medium text-[#2E7C83] hover:underline">Add income →</Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
