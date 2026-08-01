"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Target, Sparkles } from "lucide-react";

interface Dim {
  key: string;
  label: string;
  baseline: number | null;
  latest: number;
  delta: number | null;
}
interface PlanExec {
  type: string;
  title: string | null;
  version: number;
  goals: { total: number; not_started: number; in_progress: number; met: number; slipped: number };
}
interface Progress {
  hasBaseline: boolean;
  baselineAt: string | null;
  overall: { baseline: number | null; latest: number | null; delta: number | null };
  dimensions: Dim[];
  execution: {
    totals: { total: number; not_started: number; in_progress: number; met: number; slipped: number };
    plans: PlanExec[];
  };
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-[#b8a898]">new</span>;
  if (delta === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#7C7C82]">
        <Minus className="w-3.5 h-3.5" /> 0
      </span>
    );
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-[#2E7C83]" : "text-[#D83A34]"}`}
    >
      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {up ? "+" : ""}
      {delta}
    </span>
  );
}

const PLAN_LABEL: Record<string, string> = {
  business: "Business Plan",
  marketing: "Marketing Plan",
  sales: "Sales Plan",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProgressView() {
  const [data, setData] = useState<Progress | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/progress?ts=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData(d))
      .catch(() => setFailed(true));
  }, []);

  if (failed)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-sm text-[#b8a898]">Couldn&apos;t load progress right now.</p>
      </div>
    );
  if (data === null)
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-sm text-[#b8a898]">Loading your progress…</p>
      </div>
    );

  const noData = data.dimensions.length === 0;
  const t = data.execution.totals;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-[#c9a227]" />
        <span className="text-xs font-medium uppercase tracking-wide text-[#b8a898]">
          Progress since your baseline
        </span>
      </div>
      <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">Your Trajectory</h1>
      <p className="text-sm text-[#7C7C82] mb-8">
        {data.hasBaseline
          ? `Baseline set ${formatDate(data.baselineAt)}. Movement is measured against where you started.`
          : "Complete your assessments to set a baseline."}
      </p>

      {noData ? (
        <div className="rounded-2xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#c9a227]/15 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-[#c9a227]" />
          </div>
          <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70">
            No scored dimensions yet. Once you complete your assessments, your baseline is captured
            and progress starts tracking here.
          </p>
        </div>
      ) : (
        <>
          {/* Overall */}
          <div className="rounded-2xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] p-6 mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#b8a898] mb-1">Overall business health</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-serif text-[#c9a227]">{data.overall.latest ?? "—"}</span>
                <DeltaBadge delta={data.overall.delta} />
              </div>
            </div>
            <div className="text-right text-xs text-[#7C7C82]">
              <div>Baseline: {data.overall.baseline ?? "—"}</div>
              <div>Now: {data.overall.latest ?? "—"}</div>
            </div>
          </div>

          {/* Per-dimension */}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7C7C82] mb-3">
            By dimension
          </h2>
          <div className="rounded-2xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] divide-y divide-gray-100 dark:divide-[#c9a227]/10 mb-10">
            {data.dimensions.map((d) => (
              <div key={d.key} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{d.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#b8a898] w-24 text-right">
                    {d.baseline ?? "—"} → {d.latest}
                  </span>
                  <span className="w-16 text-right">
                    <DeltaBadge delta={d.delta} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Execution */}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7C7C82] mb-3">
            Plan execution
          </h2>
          {t.total === 0 ? (
            <p className="text-sm text-[#b8a898]">
              No plan goals yet — generate a Business, Marketing, or Sales plan to track execution.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <span className="text-[#2E7C83]">{t.met} met</span>
                <span className="text-[#2E7C83]/80">{t.in_progress} in progress</span>
                <span className="text-[#7C7C82]">{t.not_started} not started</span>
                <span className="text-[#D83A34]">{t.slipped} slipped</span>
                <span className="text-[#b8a898]">· {t.total} goals total</span>
              </div>
              <div className="space-y-3">
                {data.execution.plans.map((p) => (
                  <div
                    key={p.type}
                    className="rounded-xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] px-5 py-3 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {PLAN_LABEL[p.type] ?? p.type}
                      <span className="text-xs text-[#b8a898] ml-2">v{p.version}</span>
                    </span>
                    <span className="text-xs text-[#7C7C82]">
                      {p.goals.met}/{p.goals.total} met · {p.goals.in_progress} in progress
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
