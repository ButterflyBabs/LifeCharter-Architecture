"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ChevronLeft, ChevronRight, Wallet, TrendingUp, TrendingDown, Printer } from "lucide-react";
import Link from "next/link";

interface Line {
  category: string;
  amount: number;
}
interface PnL {
  label: string;
  year: number;
  index: number;
  income: { total: number; lines: Line[] };
  expense: { total: number; lines: Line[] };
  net: number;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const tz = () =>
  (typeof window !== "undefined" &&
    (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) ||
  "UTC";

export default function MonthlyReviewPage() {
  const [data, setData] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (year?: number, index?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: "month", tz: tz() });
      if (year) params.set("year", String(year));
      if (index) params.set("index", String(index));
      const res = await fetch(`/api/finance/pnl?${params.toString()}`);
      const d = await res.json().catch(() => null);
      if (d && !d.error) setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const step = (dir: -1 | 1) => {
    if (!data) return;
    let y = data.year;
    let i = data.index + dir;
    if (i < 1) { i = 12; y -= 1; }
    if (i > 12) { i = 1; y += 1; }
    load(y, i);
  };

  const savingsRate = data && data.income.total > 0 ? Math.round((data.net / data.income.total) * 100) : null;
  const topExpenses = data?.expense.lines.slice(0, 5) ?? [];

  return (
    <div className="py-6 px-4 max-w-3xl mx-auto">
      <div className="print:hidden">
        <Link href="/finance/pulse" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Financial Pulse
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Monthly Review</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => step(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] min-w-[110px] text-center">
              {data?.label ?? "…"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => step(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-[#b8a898]">No data.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
              <div className="flex items-center gap-2 text-[#2E7C83] mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Income</span>
              </div>
              <p className="text-2xl font-bold text-[#2E7C83]">{usd(data.income.total)}</p>
            </div>
            <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
              <div className="flex items-center gap-2 text-[#b06a5a] mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">Expenses</span>
              </div>
              <p className="text-2xl font-bold text-[#b06a5a]">{usd(data.expense.total)}</p>
            </div>
            <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
              <div className="flex items-center gap-2 text-[#7b6b8d] mb-1">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Net</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: data.net >= 0 ? "#2c6b3f" : "#b06a5a" }}>
                {data.net >= 0 ? "+" : "−"}
                {usd(Math.abs(data.net))}
              </p>
              {savingsRate !== null && (
                <p className="text-[11px] text-[#b8a898] mt-1">{savingsRate}% margin</p>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Where the money went</CardTitle>
            </CardHeader>
            <CardContent>
              {topExpenses.length === 0 ? (
                <p className="text-sm text-[#b8a898]">No expenses recorded for {data.label}.</p>
              ) : (
                <div className="space-y-2">
                  {topExpenses.map((l) => {
                    const pct = data.expense.total > 0 ? Math.round((l.amount / data.expense.total) * 100) : 0;
                    return (
                      <div key={l.category}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#3F4654] dark:text-[#e8e4f0]">{l.category}</span>
                          <span className="text-[#b8a898] tabular-nums">
                            {usd(l.amount)} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#1a2b4a]/10 overflow-hidden mt-1">
                          <div className="h-full rounded-full bg-[#b06a5a]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end print:hidden">
            <Link href="/finance/pnl" className="text-sm text-[#2E7C83] hover:underline">
              Open full P&amp;L →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
