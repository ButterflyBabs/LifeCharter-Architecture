"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Printer, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";

interface Line {
  category: string;
  amount: number;
}
interface PnL {
  period: "month" | "quarter" | "year";
  year: number;
  index: number;
  label: string;
  income: { total: number; lines: Line[] };
  expense: { total: number; lines: Line[] };
  net: number;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function tz(): string {
  if (typeof window === "undefined") return "UTC";
  return localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export default function PnLPage() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [year, setYear] = useState<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [data, setData] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (p: "month" | "quarter" | "year", y?: number, i?: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period: p, tz: tz() });
        if (y) params.set("year", String(y));
        if (i) params.set("index", String(i));
        const res = await fetch(`/api/finance/pnl?${params.toString()}`);
        const d = await res.json().catch(() => null);
        if (d && !d.error) {
          setData(d);
          setYear(d.year);
          setIndex(d.index);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePeriod = (p: "month" | "quarter" | "year") => {
    setPeriod(p);
    setYear(null);
    setIndex(null);
    load(p);
  };

  // Step to the previous/next period of the same type.
  const step = (dir: -1 | 1) => {
    if (year == null || index == null) return;
    let y = year;
    let i = index;
    if (period === "year") {
      y += dir;
    } else if (period === "quarter") {
      i += dir;
      if (i < 1) { i = 4; y -= 1; }
      if (i > 4) { i = 1; y += 1; }
    } else {
      i += dir;
      if (i < 1) { i = 12; y -= 1; }
      if (i > 12) { i = 1; y += 1; }
    }
    load(period, y, i);
  };

  const section = (title: string, lines: Line[], total: number) => (
    <div className="mb-5">
      <div className="flex items-center justify-between border-b border-[#1a2b4a]/15 pb-1 mb-2">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{title}</h3>
        <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(total)}</span>
      </div>
      {lines.length === 0 ? (
        <p className="text-sm text-[#b8a898]">None recorded.</p>
      ) : (
        <div className="space-y-1">
          {lines.map((l) => (
            <div key={l.category} className="flex items-center justify-between text-sm">
              <span className="text-[#3F4654] dark:text-[#e8e4f0]">{l.category}</span>
              <span className="text-[#3F4654] dark:text-[#e8e4f0] tabular-nums">{usd(l.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="py-6 px-4 max-w-3xl mx-auto">
      {/* Controls (hidden when printing) */}
      <div className="print:hidden">
        <Link href="/finance/pulse" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Financial Pulse
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#c9a227]" />
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Profit &amp; Loss</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print / Save PDF
          </Button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="inline-flex rounded-lg border border-[#1a2b4a]/15 overflow-hidden">
            {(["month", "quarter", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => changePeriod(p)}
                className={`px-4 py-1.5 text-sm capitalize ${
                  period === p ? "bg-[#c9a227]/15 text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#b8a898]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => step(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] min-w-[90px] text-center">
              {data?.label ?? "…"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => step(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Statement */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Profit &amp; Loss Statement</h2>
            <p className="text-sm text-[#b8a898]">{data?.label ?? ""}</p>
          </div>

          {loading ? (
            <p className="text-sm text-[#b8a898]">Building statement…</p>
          ) : !data ? (
            <p className="text-sm text-[#b8a898]">No data.</p>
          ) : (
            <>
              {section("Income", data.income.lines, data.income.total)}
              {section("Expenses", data.expense.lines, data.expense.total)}
              <div className="flex items-center justify-between border-t-2 border-[#1a2b4a]/25 pt-2 mt-2">
                <span className="font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Net Profit</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: data.net >= 0 ? "#2c6b3f" : "#b06a5a" }}
                >
                  {data.net >= 0 ? "" : "−"}
                  {usd(Math.abs(data.net))}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
