"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Flag, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { startOptions } from "@/lib/goalLadder";
import { milestoneQuestions, type ProposedMilestone } from "@/lib/milestoneAssessment";
import type { DimensionKey } from "@/lib/scoring/dimensionModel";

interface Latest {
  summary?: string;
  answers?: Record<string, string>;
  milestones?: ProposedMilestone[];
  assistant?: string;
  createdAt?: string;
}
interface YearGoal {
  id: string;
  title: string;
  dimension_key: string | null;
  plan_type: string;
}
interface Draft extends ProposedMilestone {
  keep: boolean;
  addTask: boolean;
}

const PLAN_LABEL: Record<string, string> = { business: "Business Plan", marketing: "Marketing Plan", sales: "Sales Plan" };
const norm = (s: string) => s.trim().toLowerCase();

// Milestone assessment for one dimension: a few short questions, then the
// client's own assistant proposes this quarter's milestones from their answers,
// scores and activity. They edit, choose, and the chosen ones become quarter
// goals on the Goal Ladder (optionally with a first-step task each).
export default function MilestoneAssessment({ dimension, label, onAdded }: { dimension: DimensionKey; label: string; onAdded?: () => void }) {
  const questions = useMemo(() => milestoneQuestions(dimension, label), [dimension, label]);
  const quarters = useMemo(() => startOptions("quarter", 2), []);
  const [loaded, setLoaded] = useState(false);
  const [hasKey, setHasKey] = useState(true);
  const [hasPlan, setHasPlan] = useState(true);
  const [assistant, setAssistant] = useState("");
  const [latest, setLatest] = useState<Latest | null>(null);
  const [yearGoals, setYearGoals] = useState<YearGoal[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [asking, setAsking] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [quarter, setQuarter] = useState(quarters[0]?.value ?? "");
  const [parentId, setParentId] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const applyProposal = useCallback((l: Latest | null, have: Set<string>) => {
    setLatest(l);
    setDrafts((l?.milestones ?? []).map((m) => ({ ...m, keep: !have.has(norm(m.title)), addTask: false })));
  }, []);

  const load = useCallback(async () => {
    const d = await fetch(`/api/goals/milestones?dimension=${dimension}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    const have = new Set<string>(((d.quarterGoals ?? []) as { title: string }[]).map((g) => norm(g.title)));
    setHasKey(d.hasKey !== false);
    setHasPlan(d.hasPlan !== false);
    setAssistant(d.assistantName || "");
    setYearGoals(d.yearGoals ?? []);
    setAdded(have);
    applyProposal(d.latest ?? null, have);
    const same = ((d.yearGoals ?? []) as YearGoal[]).find((g) => g.dimension_key === dimension);
    setParentId(same?.id ?? "");
    setLoaded(true);
  }, [dimension, applyProposal]);

  useEffect(() => {
    setAsking(false);
    setMsg("");
    setAnswers({});
    void load();
  }, [load]);

  function startAsking() {
    setAnswers(latest?.answers ?? {});
    setMsg("");
    setAsking(true);
  }

  async function assess() {
    if (!Object.values(answers).some((v) => v?.trim())) return setMsg("Answer at least one question first.");
    setBusy("assess");
    setMsg("");
    const r = await fetch("/api/goals/milestones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assess", dimension, answers }) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (d.needsKey) {
      setHasKey(false);
      return setMsg("Connect your AI in Settings → AI and your assistant will propose milestones for you.");
    }
    if (!r.ok) return setMsg(d.error || "Couldn't propose milestones just now. Try again.");
    applyProposal(d.latest, added);
    setAsking(false);
  }

  async function accept() {
    const chosen = drafts.filter((m) => m.keep && m.title.trim() && !added.has(norm(m.title)));
    if (!chosen.length) return setMsg("Choose at least one milestone to add.");
    setBusy("accept");
    setMsg("");
    const r = await fetch("/api/goals/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", dimension, periodStart: quarter, parentId: parentId || null, items: chosen }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setMsg(d.error || "Couldn't save those milestones.");
    const next = new Set(added);
    for (const m of chosen) next.add(norm(m.title));
    setAdded(next);
    setDrafts((ds) => ds.map((m) => (next.has(norm(m.title)) ? { ...m, keep: false } : m)));
    const n = d.goals?.length ?? chosen.length;
    setMsg(`Added ${n} milestone${n === 1 ? "" : "s"} to your Goal Ladder${d.tasksAdded ? ` and ${d.tasksAdded} first step${d.tasksAdded === 1 ? "" : "s"} to your Tasks` : ""}.`);
    onAdded?.();
  }

  const edit = (i: number, patch: Partial<Draft>) => setDrafts((ds) => ds.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const pending = drafts.filter((m) => m.keep && m.title.trim() && !added.has(norm(m.title))).length;

  return (
    <div id="milestones" className="rounded-2xl border border-[#1a2b4a]/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="hidden sm:flex w-9 h-9 shrink-0 rounded-full bg-[#2E7C83]/10 items-center justify-center">
          <Flag className="w-4 h-4 text-[#2E7C83]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{label} milestones for this quarter</h2>
          <p className="text-sm text-[#7a8a99]">
            Four short questions. {assistant || "Your assistant"} reads your answers with your {label} scores, goals and tasks, then proposes 3 to 5 milestones you can edit and add.
          </p>
        </div>
      </div>

      {!loaded ? (
        <p className="mt-4 text-sm text-[#7a8a99]">Loading…</p>
      ) : asking || !latest ? (
        asking ? (
          <div className="mt-4 space-y-4">
            {questions.map((q, i) => (
              <label key={q.id} className="block">
                <span className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{i + 1}. {q.q}</span>
                <span className="block text-xs text-[#7a8a99] mb-1">{q.hint}</span>
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={2}
                  maxLength={800}
                  className="w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"
                />
              </label>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={assess} disabled={busy === "assess"}>
                {busy === "assess" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                Propose my milestones
              </Button>
              {latest && (
                <Button variant="ghost" onClick={() => setAsking(false)} disabled={busy === "assess"}>
                  Back to my last proposal
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#1a2b4a]/20 border border-[#1a2b4a]/10 p-4">
            <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Set milestones built from your own answers and numbers, not a template.</p>
            <button onClick={startAsking} className="inline-flex items-center gap-1.5 rounded-full bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white">
              <Sparkles className="w-4 h-4" /> Start the assessment
            </button>
          </div>
        )
      ) : (
        <div className="mt-4 space-y-3">
          {latest.summary && <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{latest.summary}</p>}
          <div className="space-y-2">
            {drafts.map((m, i) => {
              const done = added.has(norm(m.title));
              return (
                <div key={i} className={`rounded-xl border p-3 ${done ? "border-[#2c6b3f]/30 bg-[#2c6b3f]/5" : "border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20"}`}>
                  <div className="flex items-start gap-2">
                    {done ? (
                      <Check className="mt-2.5 w-4 h-4 shrink-0 text-[#2c6b3f]" aria-label="Added" />
                    ) : (
                      <input type="checkbox" checked={m.keep} onChange={(e) => edit(i, { keep: e.target.checked })} className="mt-3 h-4 w-4 shrink-0" aria-label="Include this milestone" />
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      {done ? (
                        <p className="pt-1.5 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                          {m.title}
                          <span className="ml-2 text-xs font-normal text-[#2c6b3f]">On your Goal Ladder</span>
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input className="min-w-0 flex-1" value={m.title} onChange={(e) => edit(i, { title: e.target.value })} aria-label="Milestone" />
                          <Input className="min-w-0 sm:w-56" value={m.target} placeholder="Target" onChange={(e) => edit(i, { target: e.target.value })} aria-label="Target" />
                        </div>
                      )}
                      {m.why && <p className="text-xs text-[#7a8a99]">{m.why}</p>}
                      {m.firstStep && !done && (
                        <label className="flex items-start gap-2 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
                          <input type="checkbox" checked={m.addTask} onChange={(e) => edit(i, { addTask: e.target.checked })} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            Add the first step to my Tasks: <em>{m.firstStep}</em>
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!!pending && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm" aria-label="Which quarter">
                {quarters.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
              {!!yearGoals.length && (
                <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-10 min-w-0 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm sm:max-w-xs" aria-label="Which year goal these support">
                  <option value="">Not tied to a year goal</option>
                  {yearGoals.map((g) => (
                    <option key={g.id} value={g.id}>Supports: {g.title.slice(0, 60)}{PLAN_LABEL[g.plan_type] ? ` (${PLAN_LABEL[g.plan_type]})` : ""}</option>
                  ))}
                </select>
              )}
              <Button onClick={accept} disabled={busy === "accept" || !hasPlan}>
                {busy === "accept" && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Add {pending} milestone{pending === 1 ? "" : "s"}
              </Button>
            </div>
          )}
          {!hasPlan && (
            <p className="text-sm text-[#8a6a15]">
              Milestones are saved under your plan. <Link href="/business-plan" className="underline">Build your Business Plan</Link> first, then add them here.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <button onClick={startAsking} className="text-[#2E7C83] hover:underline">Retake the assessment</button>
            <Link href="/planning/goals" className="text-[#2E7C83] hover:underline">Open the Goal Ladder</Link>
            {latest.createdAt && <span className="text-[#b8a898]">Proposed {new Date(latest.createdAt).toLocaleDateString()}{latest.assistant ? ` by ${latest.assistant}` : ""}</span>}
          </div>
        </div>
      )}

      {!hasKey && !msg && (
        <p className="mt-3 text-sm text-[#8a6a15]">
          Connect your AI in <Link href="/settings?tab=ai" className="underline">Settings → AI</Link> and your assistant will propose milestones for you.
        </p>
      )}
      {msg && <p className="mt-3 text-sm text-[#8a6a15]">{msg}</p>}
    </div>
  );
}
