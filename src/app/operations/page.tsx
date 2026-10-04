"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Settings, Sparkles, Loader2 } from "lucide-react";
import { PILLAR_PLAN_LINK } from "@/lib/operations";
import { PHASE_COLOR, type Phase } from "@/lib/scoring/phase";

interface PillarSource {
  kind: string;
  label: string;
  weightPct: number;
  subScore: number | null;
  note?: string;
}

interface Pillar {
  key: string;
  name: string;
  description: string;
  score: number | null;
  phase: Phase | null;
  partial: boolean;
  sources: PillarSource[];
  notes: string;
  deeper: { answered: number; total: number };
}

interface OpInsight {
  pillar: string;
  priority: "high" | "medium" | "low";
  detail: string;
}

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  high: { color: "#8a2f2f", bg: "#f6dcdc" },
  medium: { color: "#8a6a15", bg: "#f4e6c9" },
  low: { color: "#1c5a60", bg: "#d3ebee" },
};

const PHASES: Phase[] = ["Survival", "Growth", "Expansion", "Legacy"];

export default function OperationsPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [opsScore, setOpsScore] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [insights, setInsights] = useState<OpInsight[]>([]);
  const [headline, setHeadline] = useState<string>("");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string>("");
  const [needsKey, setNeedsKey] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/operations");
      const d = await res.json().catch(() => ({}));
      if (Array.isArray(d.pillars)) setPillars(d.pillars);
      if (d.counts) setCounts(d.counts);
      setOpsScore(typeof d.operationsScore === "number" ? d.operationsScore : null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    // The last insights their assistant gave, if any.
    fetch("/api/operations/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const s = d?.saved;
        if (s && Array.isArray(s.insights)) {
          setHeadline(typeof s.headline === "string" ? s.headline : "");
          setInsights(s.insights);
        }
      })
      .catch(() => {});
  }, [load]);

  const runInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError("");
    setNeedsKey(false);
    try {
      const res = await fetch("/api/operations/insights", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (d.needsKey) {
        setNeedsKey(true);
      } else if (d.error) {
        setInsightsError(d.error);
      } else {
        setHeadline(typeof d.headline === "string" ? d.headline : "");
        setInsights(Array.isArray(d.insights) ? d.insights : []);
      }
    } catch {
      setInsightsError("Couldn't reach the insights service — try again in a moment.");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const saveNotes = async (key: string, notes: string) => {
    setPillars((prev) => prev.map((p) => (p.key === key ? { ...p, notes } : p)));
    setSavingKey(key);
    try {
      await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pillarKey: key, notes }),
      });
    } finally {
      setSavingKey(null);
    }
  };

  const scoredCount = pillars.filter((p) => p.score !== null).length;

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7b6b8d] to-[#2E7C83] flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Operations</h1>
          <p className="text-[#b8a898]">Your 8 operational pillars, scored from your answers and your activity in the Suite</p>
        </div>
        <Link href="/operations/sops" className="ml-auto rounded-full border border-[#1a2b4a]/15 px-4 py-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] hover:border-[#c9a227]">
          Playbook & SOPs →
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <div className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#c9a227]/40 p-4">
          <p className="text-xs text-[#b8a898]">Operations score</p>
          <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mt-1">{opsScore ?? "—"}</p>
        </div>
        {PHASES.map((ph) => (
          <div key={ph} className="bg-white dark:bg-[#1a2b4a]/40 rounded-xl border border-[#1a2b4a]/10 p-4">
            <span className="text-sm" style={{ color: PHASE_COLOR[ph] }}>{ph}</span>
            <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mt-1">{counts[ph] || 0}</p>
          </div>
        ))}
      </div>

      {loaded && (
        <p className="text-sm text-[#7b6b8d] dark:text-[#b8a898] mb-6 max-w-3xl">
          Each pillar is scored for you, the same way your 12 dimensions are: from your Brain and Profit assessments, your Quick Pulse
          check-ins, what you do in the Suite (leads, pipeline, SOPs, sequences, referrals), and the Go deeper questions for that pillar.
          {scoredCount < 8 ? ` ${8 - scoredCount} of 8 can't be scored yet. Answer their Go deeper questions to bring them in.` : ""}
          {" "}Your Operations score is built from these eight.
        </p>
      )}

      {/* AI Operations Insights */}
      <div className="mb-8 rounded-2xl border border-[#2E7C83]/25 bg-gradient-to-br from-[#F1F7F7] to-[#EFE9F1] dark:from-[#12303a] dark:to-[#241d33] p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2E7C83]" />
            <h2 className="text-lg font-semibold text-[#12303a] dark:text-[#F8F5F0]">AI Operations Insights</h2>
          </div>
          <button
            onClick={runInsights}
            disabled={insightsLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
          >
            {insightsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {insights.length || headline ? "Refresh" : "Generate insights"}
          </button>
        </div>

        {needsKey ? (
          <p className="text-sm text-[#5a5148] dark:text-[#d8d2c8]">
            Connect your AI key in settings to get insights on your operational pillars.
          </p>
        ) : insightsError ? (
          <p className="text-sm text-[#8a2f2f] dark:text-[#f0b8b8]">{insightsError}</p>
        ) : insightsLoading ? (
          <p className="text-sm text-[#3a3630] dark:text-[#d8d2c8]">Reading your pillars…</p>
        ) : !headline && insights.length === 0 ? (
          <p className="text-sm text-[#3a3630] dark:text-[#d8d2c8]">
            Answer the Go deeper questions on a few pillars, then generate insights to see where to focus next.
          </p>
        ) : (
          <>
            {headline && (
              <p className="text-[15px] font-medium text-[#12303a] dark:text-[#F8F5F0] mb-3">{headline}</p>
            )}
            <div className="space-y-2">
              {insights.map((ins, i) => {
                const pm = PRIORITY_META[ins.priority] || PRIORITY_META.low;
                return (
                  <div
                    key={i}
                    className="rounded-xl bg-white dark:bg-[#0f2530] border border-[#1a2b4a]/10 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ color: pm.color, backgroundColor: pm.bg }}
                      >
                        {ins.priority}
                      </span>
                      <span className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{ins.pillar}</span>
                    </div>
                    <p className="text-sm text-[#3a3630] dark:text-[#d8d2c8] leading-relaxed">{ins.detail}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loaded ? (
          <p className="text-sm text-[#b8a898]">Loading…</p>
        ) : (
          pillars.map((p) => {
            const color = p.phase ? PHASE_COLOR[p.phase] : "#9CA3AF";
            return (
              <Card key={p.key}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <p className="text-xs text-[#b8a898] mt-0.5">{p.description}</p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-2xl font-bold leading-none" style={{ color }}>{p.score ?? "—"}</span>
                    <span className="mt-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}1f` }}>
                      {p.phase ?? "Not scored yet"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium text-[#b8a898] mb-1.5">What your score is built from</p>
                  <ul className="mb-3 space-y-1.5">
                    {p.sources.map((s) => (
                      <li key={s.label} className="text-xs text-[#3a3630] dark:text-[#d8d2c8]">
                        <div className="flex items-center justify-between gap-2">
                          <span>{s.label}</span>
                          <span className="text-[#7b6b8d] dark:text-[#b8a898]">{s.subScore === null ? s.note ?? "No data yet" : `${s.subScore}`}</span>
                        </div>
                        {s.subScore !== null && (
                          <div className="mt-0.5 h-1 rounded-full bg-[#1a2b4a]/10">
                            <div className="h-1 rounded-full" style={{ width: `${s.subScore}%`, backgroundColor: color }} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <label className="block text-xs font-medium text-[#b8a898] mb-1">Notes</label>
                  <textarea
                    defaultValue={p.notes}
                    disabled={savingKey === p.key}
                    onBlur={(e) => {
                      if (e.target.value !== p.notes) saveNotes(p.key, e.target.value);
                    }}
                    rows={2}
                    placeholder="What's working, what needs attention…"
                    className="w-full p-2 text-sm rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"
                  />
                  {PILLAR_PLAN_LINK[p.key] && (
                    <Link href={PILLAR_PLAN_LINK[p.key].href} className="mt-2 block text-xs text-[#7a8a99] hover:underline">
                      Planned in your {PILLAR_PLAN_LINK[p.key].plan} · {PILLAR_PLAN_LINK[p.key].section} →
                    </Link>
                  )}
                  <Link href={`/operations/${p.key}`} className="mt-3 flex items-center justify-between rounded-lg border border-[#2E7C83]/25 px-3 py-2 text-sm font-medium text-[#2E7C83] hover:bg-[#2E7C83]/5">
                    <span>Go deeper</span>
                    <span className="text-xs font-normal text-[#7b6b8d]">
                      {p.deeper.answered > 0 ? `${p.deeper.answered} of ${p.deeper.total} answered` : `${p.deeper.total} questions`} →
                    </span>
                  </Link>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
