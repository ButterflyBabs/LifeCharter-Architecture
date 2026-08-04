"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Printer, ChevronLeft, ChevronRight, FileText, Download, FileDown } from "lucide-react";
import Link from "next/link";

type Period = "week" | "month" | "quarter" | "year" | "custom";
interface Line {
  category: string;
  amount: number;
}
interface PnL {
  period: Period;
  year: number;
  index: number;
  weekStart: string | null;
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

// Shift a YYYY-MM-DD by n days (UTC).
function shiftDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function PnLPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const load = useCallback(
    async (p: Period, opts: { year?: number; index?: number; start?: string; end?: string } = {}) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period: p, tz: tz() });
        if (opts.year) params.set("year", String(opts.year));
        if (opts.index) params.set("index", String(opts.index));
        if (opts.start) params.set("start", opts.start);
        if (opts.end) params.set("end", opts.end);
        const res = await fetch(`/api/finance/pnl?${params.toString()}`);
        const d = await res.json().catch(() => null);
        if (d && !d.error) setData(d);
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

  const changePeriod = (p: Period) => {
    setPeriod(p);
    if (p !== "custom") load(p);
  };

  const applyCustom = () => {
    if (customStart && customEnd) load("custom", { start: customStart, end: customEnd });
  };

  const step = (dir: -1 | 1) => {
    if (!data) return;
    if (period === "week") {
      load("week", { start: shiftDays(data.weekStart || new Date().toISOString().slice(0, 10), dir * 7) });
      return;
    }
    let y = data.year;
    let i = data.index + dir;
    if (period === "year") {
      y += dir;
      load("year", { year: y });
      return;
    }
    const max = period === "quarter" ? 4 : 12;
    if (i < 1) { i = max; y -= 1; }
    if (i > max) { i = 1; y += 1; }
    load(period, { year: y, index: i });
  };

  // Current export params → query string.
  const exportParams = () => {
    const params = new URLSearchParams({ period, tz: tz() });
    if (period === "custom") {
      if (customStart) params.set("start", customStart);
      if (customEnd) params.set("end", customEnd);
    } else if (data) {
      if (period === "week" && data.weekStart) params.set("start", data.weekStart);
      else {
        params.set("year", String(data.year));
        if (period === "month" || period === "quarter") params.set("index", String(data.index));
      }
    }
    return params.toString();
  };

  const downloadCsv = () => {
    window.location.href = `/api/finance/export?${exportParams()}`;
  };

  const downloadPdf = async () => {
    if (!data) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const left = 56;
    const right = 556;
    let y = 70;
    doc.setFontSize(16);
    doc.text("Profit & Loss Statement", left, y);
    doc.setFontSize(11);
    doc.setTextColor(120);
    y += 18;
    doc.text(data.label, left, y);
    doc.setTextColor(0);

    const sectionHeader = (title: string, total: number) => {
      y += 26;
      doc.setFontSize(12);
      doc.text(title, left, y);
      doc.text(usd(total), right, y, { align: "right" });
      y += 6;
      doc.setDrawColor(200);
      doc.line(left, y, right, y);
      doc.setFontSize(10);
    };
    const line = (label: string, amount: number) => {
      y += 16;
      doc.text(label, left + 8, y);
      doc.text(usd(amount), right, y, { align: "right" });
    };

    sectionHeader("Income", data.income.total);
    if (data.income.lines.length === 0) line("None recorded", 0);
    else data.income.lines.forEach((l) => line(l.category, l.amount));

    sectionHeader("Expenses", data.expense.total);
    if (data.expense.lines.length === 0) line("None recorded", 0);
    else data.expense.lines.forEach((l) => line(l.category, l.amount));

    y += 26;
    doc.setDrawColor(80);
    doc.line(left, y, right, y);
    y += 18;
    doc.setFontSize(12);
    doc.text("Net Profit", left, y);
    doc.text(usd(data.net), right, y, { align: "right" });

    doc.save(`finance-${data.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
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
      <div className="print:hidden">
        <Link href="/finance/pulse" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Financial Pulse
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#c9a227]" />
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Profit &amp; Loss</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadCsv}>
              <Download className="w-4 h-4 mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <FileDown className="w-4 h-4 mr-1.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" /> Print
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="inline-flex rounded-lg border border-[#1a2b4a]/15 overflow-hidden">
            {(["week", "month", "quarter", "year", "custom"] as const).map((p) => (
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
          {period === "custom" ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-sm p-1.5 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20"
              />
              <span className="text-[#b8a898] text-sm">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-sm p-1.5 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20"
              />
              <Button size="sm" onClick={applyCustom} disabled={!customStart || !customEnd}>
                Apply
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => step(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] min-w-[130px] text-center">
                {data?.label ?? "…"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => step(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

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
                <span className="font-bold tabular-nums" style={{ color: data.net >= 0 ? "#2c6b3f" : "#b06a5a" }}>
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
