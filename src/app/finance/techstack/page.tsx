"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Zap, Sparkles, RefreshCw, TrendingDown } from "lucide-react";
import Link from "next/link";
import { CADENCE_LABEL, type BillCadence } from "@/lib/finance/billDates";
import { FinanceRelated } from "@/components/finance/FinanceRelated";
import { useFinanceOverview } from "@/components/finance/useFinanceOverview";

interface Tool {
  name: string;
  ytd: number;
  monthly: number;
  vendor?: string;
  frequency?: string | null;
  renewal?: string | null;
}
interface BillLite {
  name: string;
  vendor: string;
}
interface Suggestion {
  title: string;
  detail: string;
  steps: string[];
  estMonthlySavings?: number;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function TechStackPage() {
  const { overview, reload: reloadOverview } = useFinanceOverview();
  const [bills, setBills] = useState<BillLite[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalYtd, setTotalYtd] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [optimizing, setOptimizing] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const loadBills = () =>
    fetch("/api/finance/bills", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBills(Array.isArray(d.bills) ? d.bills : []))
      .catch(() => {});
  useEffect(() => {
    void loadBills();
  }, []);

  const onBills = (t: Tool) =>
    bills.some((b) => {
      const n = (t.vendor || t.name).toLowerCase();
      return b.name.toLowerCase() === n || (b.vendor || "").toLowerCase() === n || b.name.toLowerCase().includes(n);
    });

  // Put a tool's next renewal on the Bills & cash calendar (monthly unless it was recorded as repeating differently).
  const addToBills = async (t: Tool) => {
    setAdding(t.name);
    const cadence = (t.frequency && t.frequency in CADENCE_LABEL ? t.frequency : "monthly") as BillCadence;
    const d = new Date();
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const nextDue = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
    await fetch("/api/finance/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t.name,
        vendor: t.vendor || undefined,
        amount: t.monthly,
        category: "Software",
        cadence,
        nextDue,
        autopay: t.renewal === "auto",
        notes: "From Tech Stack Optimizer",
      }),
    }).catch(() => {});
    await loadBills();
    void reloadOverview();
    setAdding(null);
  };

  useEffect(() => {
    fetch("/api/finance/techstack")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setTools(d.tools || []);
        setTotalMonthly(d.totalMonthly || 0);
        setTotalYtd(d.totalYtd || 0);
      })
      .finally(() => setLoaded(true));
  }, []);

  const optimize = async () => {
    setOptimizing(true);
    setNeedsKey(false);
    setSummary(null);
    setSuggestions([]);
    try {
      const res = await fetch("/api/finance/techstack", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) setNeedsKey(true);
      else {
        setSummary(d.summary || "");
        setSuggestions(d.suggestions || []);
      }
    } finally {
      setOptimizing(false);
    }
  };

  const totalSavings = suggestions.reduce((s, x) => s + (Number(x.estMonthlySavings) || 0), 0);

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <Link href="/finance" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Finance Center
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-full bg-[#c98a27]/15 flex items-center justify-center">
          <Zap className="w-6 h-6 text-[#c98a27]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Tech Stack Optimizer</h1>
          <p className="text-[#b8a898]">Your software &amp; subscription spend, from the ledger</p>
        </div>
      </div>

      <FinanceRelated variant="tech" overview={overview} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Est. monthly</p>
          <p className="text-2xl font-bold text-[#c98a27]">{usd(totalMonthly)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Year to date</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(totalYtd)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
          <p className="text-sm text-[#7b6b8d]">Tools tracked</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{tools.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your tools</CardTitle>
          </CardHeader>
          <CardContent>
            {!loaded ? (
              <p className="text-sm text-[#b8a898]">Loading…</p>
            ) : tools.length === 0 ? (
              <p className="text-sm text-[#b8a898]">
                No software/subscription expenses detected yet. Tag expenses with categories like &quot;Software&quot;
                or &quot;Subscription&quot; (or name the tool in the note) and they&apos;ll show up here.
              </p>
            ) : (
              <div className="space-y-1.5">
                {tools.map((t) => (
                  <div key={t.name} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="text-[#3F4654] dark:text-[#e8e4f0] truncate block">{t.name}</span>
                      <span className="text-[11px] text-[#b8a898]">
                        {t.frequency && t.frequency in CADENCE_LABEL ? `${CADENCE_LABEL[t.frequency as BillCadence]} · ` : ""}
                        {t.renewal === "auto" ? "Auto-renews" : t.renewal === "manual" ? "Renew manually" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="tabular-nums text-[#1a2b4a] dark:text-[#F8F5F0]">
                        {usd(t.monthly)}<span className="text-[#b8a898]">/mo</span>
                      </span>
                      {onBills(t) ? (
                        <Link href="/finance/bills" className="text-[11px] text-[#2E7C83] hover:underline whitespace-nowrap">On Bills</Link>
                      ) : (
                        <button
                          onClick={() => addToBills(t)}
                          disabled={adding === t.name}
                          className="text-[11px] text-[#2E7C83] hover:underline whitespace-nowrap disabled:opacity-50"
                        >
                          {adding === t.name ? "Adding…" : "Add to Bills"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#f6f1fa] to-[#eef4f4] border-[#E8E4F0]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7b6b8d]" /> AI Optimization
              </h3>
              {(summary || suggestions.length > 0) && (
                <button onClick={optimize} disabled={optimizing} className="text-xs text-[#2E7C83] hover:underline">
                  <RefreshCw className={`w-3.5 h-3.5 inline ${optimizing ? "animate-spin" : ""}`} />
                </button>
              )}
            </div>

            {needsKey ? (
              <div className="text-sm">
                <p className="text-[#3F4654] mb-2">Connect your OpenAI key to get consolidation &amp; savings ideas.</p>
                <Link href="/settings?tab=ai">
                  <Button variant="outline" size="sm">Set up your AI assistant</Button>
                </Link>
              </div>
            ) : summary || suggestions.length ? (
              <div className="space-y-3">
                {totalSavings > 0 && (
                  <div className="flex items-center gap-2 text-sm text-[#2c6b3f] font-medium">
                    <TrendingDown className="w-4 h-4" /> Potential savings ~{usd(totalSavings)}/mo
                  </div>
                )}
                {summary && <p className="text-sm text-[#3F4654]">{summary}</p>}
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-white/70 rounded-lg border border-[#E8E4F0] p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-indigo-900">{s.title}</span>
                      {Number(s.estMonthlySavings) > 0 && (
                        <span className="text-xs text-[#2c6b3f]">~{usd(Number(s.estMonthlySavings))}/mo</span>
                      )}
                    </div>
                    <p className="text-sm text-[#3F4654] mt-1 mb-1">{s.detail}</p>
                    {s.steps?.length > 0 && (
                      <ul className="text-sm text-[#3F4654] space-y-0.5">
                        {s.steps.map((st, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-[#2E7C83] mt-0.5">→</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-[#3F4654] mb-3">
                  Let your assistant scan your tools for redundancies, plan downgrades, and savings.
                </p>
                <Button onClick={optimize} disabled={optimizing || tools.length === 0}>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {optimizing ? "Analyzing…" : "Optimize with AI"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
