"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Target, AlertCircle } from "lucide-react";
import { DIMENSION_LABEL } from "@/lib/scoring/dimensionModel";

export type PlanType = "business" | "marketing" | "sales";

interface Goal {
  id: string;
  dimension_key: string | null;
  title: string;
  detail: string | null;
  target: string | null;
  status: "not_started" | "in_progress" | "met" | "slipped";
  sort_order: number;
}
interface Plan {
  id: string;
  plan_type: PlanType;
  version: number;
  status: string;
  generated_by: string;
  title: string | null;
  summary: string | null;
  created_at: string;
}
interface PlanResponse {
  hasPlan: boolean;
  plan?: Plan;
  goals?: Goal[];
}

const GOAL_STATUS: Record<Goal["status"], { label: string; chip: string; dot: string }> = {
  not_started: { label: "Not started", chip: "bg-[#9DA890]/15 text-[#5b6b52]", dot: "#9DA890" },
  in_progress: { label: "In progress", chip: "bg-[#2E7C83]/12 text-[#2E7C83]", dot: "#2E7C83" },
  met: { label: "Met", chip: "bg-[#2E7C83]/15 text-[#2E7C83]", dot: "#2E7C83" },
  slipped: { label: "Slipped", chip: "bg-[#D83A34]/12 text-[#D83A34]", dot: "#D83A34" },
};
const STATUS_ORDER: Goal["status"][] = ["not_started", "in_progress", "met", "slipped"];

const TITLE: Record<PlanType, string> = {
  business: "Business Plan",
  marketing: "Marketing Plan",
  sales: "Sales Plan",
};

function dimLabel(key: string | null): string | null {
  if (!key) return null;
  return (DIMENSION_LABEL as Record<string, string>)[key] ?? key.replace(/_/g, " ");
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PlanView({ planType }: { planType: PlanType }) {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState<string | null>(null);

  const load = () =>
    fetch(`/api/plans?type=${planType}&ts=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { hasPlan: false }))
      .then((d) => setData(d))
      .catch(() => setData({ hasPlan: false }));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planType]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          body?.error ??
            (res.status === 400
              ? "AI isn't configured yet."
              : "Couldn't generate a plan right now.")
        );
      } else {
        await load();
      }
    } catch {
      setError("Couldn't reach the plan generator.");
    }
    setGenerating(false);
  };

  const setGoalStatus = async (goalId: string, status: Goal["status"]) => {
    setSavingGoal(goalId);
    // Optimistic local update.
    setData((prev) =>
      prev && prev.goals
        ? { ...prev, goals: prev.goals.map((g) => (g.id === goalId ? { ...g, status } : g)) }
        : prev
    );
    try {
      await fetch("/api/plans/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, status }),
      });
    } catch {
      /* keep optimistic value */
    }
    setSavingGoal(null);
  };

  const hasPlan = data?.hasPlan && data.plan;
  const goals = data?.goals ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#c9a227]" />
            <span className="text-xs font-medium uppercase tracking-wide text-[#b8a898]">
              AI-generated from your assessments
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
            {hasPlan && data!.plan!.title ? data!.plan!.title : TITLE[planType]}
          </h1>
          {hasPlan && (
            <p className="text-sm text-[#7C7C82] mt-1">
              Version {data!.plan!.version} · generated {formatDate(data!.plan!.created_at)}
            </p>
          )}
        </div>
        {hasPlan && (
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/5 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Regenerating…" : "Regenerate"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-[#D83A34]/30 bg-[#D83A34]/5 p-3 text-sm text-[#D83A34]">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data === null ? (
        <p className="text-sm text-[#b8a898]">Loading…</p>
      ) : !hasPlan ? (
        <div className="rounded-2xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#c9a227]/15 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-[#c9a227]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
            No {TITLE[planType].toLowerCase()} yet
          </h2>
          <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 max-w-md mx-auto mb-5">
            Generate one from your Brain, Soul, and Profit assessments. It builds concrete,
            dimension-tied goals from your actual answers — not a template.
          </p>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1a2b4a] text-white text-sm font-medium hover:bg-[#1a2b4a]/90 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generating ? "animate-pulse" : ""}`} />
            {generating ? "Generating…" : `Generate ${TITLE[planType]}`}
          </button>
        </div>
      ) : (
        <>
          {data!.plan!.summary && (
            <p className="text-[#1a2b4a]/80 dark:text-[#F8F5F0]/80 leading-relaxed mb-8">
              {data!.plan!.summary}
            </p>
          )}

          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7C7C82] mb-3">
            Goals ({goals.length})
          </h3>
          <div className="space-y-3">
            {goals.map((g) => {
              const s = GOAL_STATUS[g.status];
              const dl = dimLabel(g.dimension_key);
              return (
                <div
                  key={g.id}
                  className="rounded-xl border border-gray-200/70 dark:border-[#c9a227]/20 bg-white dark:bg-[#1A1A2E] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{g.title}</h4>
                    <div className={`relative flex-shrink-0 ${savingGoal === g.id ? "opacity-60" : ""}`}>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium pl-2.5 pr-6 py-1 rounded-full ${s.chip}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                        {s.label}
                      </span>
                      <select
                        aria-label="Goal status"
                        value={g.status}
                        disabled={savingGoal === g.id}
                        onChange={(e) => setGoalStatus(g.id, e.target.value as Goal["status"])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      >
                        {STATUS_ORDER.map((st) => (
                          <option key={st} value={st}>
                            {GOAL_STATUS[st].label}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-current opacity-60"
                        viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"
                      >
                        <path d="M1 1l4 4 4-4" />
                      </svg>
                    </div>
                  </div>
                  {g.detail && (
                    <p className="text-sm text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 mt-1.5">{g.detail}</p>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                    {dl && (
                      <span className="px-2 py-0.5 rounded-full bg-[#1a2b4a]/10 text-[#1a2b4a] dark:text-[#e8e4f0]">
                        {dl}
                      </span>
                    )}
                    {g.target && (
                      <span className="text-[#7C7C82]">
                        <span className="font-medium text-[#2E7C83]">Target:</span> {g.target}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-xs text-[#b8a898]">
            This plan is living — regenerate it after new assessments, or as your business
            evolves. Check-ins will score progress against these goals.
          </p>
        </>
      )}
    </div>
  );
}
