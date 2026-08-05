"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle, Info } from "lucide-react";
import Link from "next/link";

interface Insight {
  title: string;
  severity: "high" | "medium" | "low";
  detail: string;
  steps: string[];
}
interface Analysis {
  score: number | null;
  assessment: string;
  insights: Insight[];
}

const sevIcon = (s: string) =>
  s === "high" ? (
    <AlertTriangle className="w-4 h-4 text-[#b06a5a]" />
  ) : s === "medium" ? (
    <Info className="w-4 h-4 text-[#c9a227]" />
  ) : (
    <CheckCircle className="w-4 h-4 text-[#2E7C83]" />
  );

export function FinanceAI() {
  const [loading, setLoading] = useState(true);
  const [needsKey, setNeedsKey] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsKey(false);
    setEmpty(false);
    try {
      const res = await fetch("/api/finance/analysis", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) setNeedsKey(true);
      else if (d.empty) setEmpty(true);
      else if (!res.ok) setError(d?.error || "Couldn't analyze.");
      else setData(d);
    } catch {
      setError("Couldn't analyze.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <Card className="mb-6 bg-gradient-to-br from-[#f6f1fa] to-[#eef4f4] border-[#E8E4F0]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5E3B6C] to-[#2E7C83] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-serif text-lg text-indigo-900">AI Health Assessment</h3>
            {data?.score != null && (
              <span className="ml-1 text-sm font-semibold text-[#7b6b8d]">· {data.score}/100</span>
            )}
          </div>
          {!needsKey && !empty && (
            <button
              onClick={run}
              disabled={loading}
              className="inline-flex items-center gap-1 text-xs text-[#2E7C83] hover:text-[#2E7C83]/80 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>

        {needsKey ? (
          <div className="text-sm">
            <p className="text-[#3F4654] mb-2">
              Connect your OpenAI key and your assistant will grade your financial health and flag where to improve.
            </p>
            <Link href="/settings?tab=ai">
              <Button variant="outline" size="sm">Set up your AI assistant</Button>
            </Link>
          </div>
        ) : empty ? (
          <p className="text-sm text-[#3F4654]">
            No financial data yet. Add income and expenses (or import a statement) and I&apos;ll assess your health.
          </p>
        ) : loading && !data ? (
          <p className="text-sm text-[#3F4654]">Reading your numbers…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : data ? (
          <div className="space-y-4">
            <p className="text-[#3F4654] leading-relaxed">{data.assessment}</p>
            {data.insights.map((ins, i) => (
              <div key={i} className="bg-white/70 rounded-lg border border-[#E8E4F0] p-3">
                <div className="flex items-center gap-2 mb-1">
                  {sevIcon(ins.severity)}
                  <span className="font-medium text-indigo-900">{ins.title}</span>
                </div>
                <p className="text-sm text-[#3F4654] mb-2">{ins.detail}</p>
                {ins.steps?.length > 0 && (
                  <ul className="text-sm text-[#3F4654] space-y-1">
                    {ins.steps.map((s, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="text-[#2E7C83] mt-0.5">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
