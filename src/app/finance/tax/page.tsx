"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Receipt, Download, PiggyBank } from "lucide-react";
import Link from "next/link";

interface Line {
  category: string;
  amount: number;
}
interface YearPnL {
  year: number;
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

export default function TaxPrepPage() {
  const [data, setData] = useState<YearPnL | null>(null);
  const [rate, setRate] = useState(25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/finance/pnl?period=year&tz=${encodeURIComponent(tz())}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const net = data?.net ?? 0;
  const taxable = Math.max(0, net);
  const setAside = Math.round((taxable * rate) / 100);
  const perQuarter = Math.round(setAside / 4);

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <Link href="/finance" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Finance Center
      </Link>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#4a9b9b]/15 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-[#4a9b9b]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Tax Preparation</h1>
            <p className="text-[#b8a898]">{data ? `Year to date · ${data.year}` : "Year to date"}</p>
          </div>
        </div>
        <a href={`/api/finance/export?period=year&tz=${encodeURIComponent(tz())}`}>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" /> Export year (CSV)
          </Button>
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : (
        <>
          {/* Set-aside estimate */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-[#c9a227]" />
                Estimated tax set-aside
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-[#b8a898]">Income (YTD)</p>
                  <p className="text-lg font-bold text-[#2E7C83]">{usd(data?.income.total ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#b8a898]">Deductible expenses</p>
                  <p className="text-lg font-bold text-[#b06a5a]">{usd(data?.expense.total ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#b8a898]">Taxable net</p>
                  <p className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(taxable)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#b8a898]">Set aside ({rate}%)</p>
                  <p className="text-lg font-bold text-[#c9a227]">{usd(setAside)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#b8a898]">Estimated tax rate</label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={rate}
                  onChange={(e) => setRate(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
                  className="w-20"
                />
                <span className="text-sm text-[#b8a898]">% · about {usd(perQuarter)} per quarter</span>
              </div>
              <p className="text-xs text-[#b8a898] mt-3">
                A planning estimate only — not tax advice. Confirm your rate and obligations with your accountant.
              </p>
            </CardContent>
          </Card>

          {/* Deductions by category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Potential deductions (expenses by category)</CardTitle>
            </CardHeader>
            <CardContent>
              {!data || data.expense.lines.length === 0 ? (
                <p className="text-sm text-[#b8a898]">No expenses recorded yet this year.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.expense.lines.map((l) => (
                    <div key={l.category} className="flex items-center justify-between text-sm">
                      <span className="text-[#3F4654] dark:text-[#e8e4f0]">{l.category}</span>
                      <span className="tabular-nums text-[#b06a5a]">{usd(l.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold border-t border-[#1a2b4a]/10 pt-1.5 mt-1.5">
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Total</span>
                    <span className="tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(data.expense.total)}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-[#b8a898] mt-3">
                Export the year&apos;s transactions above to hand off to your accountant or import into tax software.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
