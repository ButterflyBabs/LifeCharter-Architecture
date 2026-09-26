"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Sparkles, Loader2, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";

// The AI panels on the Strategic Planning pages. Each one is the client's OWN
// assistant (named for them, on their key, following their instructions), reads
// what it knows about their business, and — where it makes sense — the client
// can apply its suggestion to the part of the Suite it feeds. What it writes is
// stored with their account.

type Item = { title: string; detail?: string; why?: string; area?: string; href?: string };

const post = async (url: string, body?: unknown) => {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { ok: res.ok, d: (await res.json().catch(() => ({}))) as Record<string, unknown> };
};

function Shell({ name, title, blurb, children, onRun, running, hasResult, runLabel, needsKey, stamp }: {
  name: string; title: string; blurb: string; children?: ReactNode; onRun: () => void; running: boolean; hasResult: boolean; runLabel: string; needsKey: boolean; stamp?: string;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-[#2E7C83]/25 bg-[#F1F7F7] dark:bg-[#12303a] p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5E3B6C] to-[#2E7C83] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <div>
            <h2 className="font-semibold text-[#12303a] dark:text-[#F8F5F0]">{name}&apos;s {title}</h2>
            <p className="text-xs text-[#5a6472] dark:text-[#c3ccd8]">{blurb}</p>
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={running || needsKey}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-[#2E7C83] text-white hover:bg-[#256b71] disabled:opacity-60"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : hasResult ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {running ? "Reading…" : hasResult ? "Refresh" : runLabel}
        </button>
      </div>
      {needsKey && (
        <p className="mt-3 text-sm text-[#8a6a15]">
          Connect your AI key to use your assistant here. <Link href="/settings?tab=ai" className="underline font-medium">Open AI settings</Link>
        </p>
      )}
      {children}
      {stamp && <p className="mt-3 text-[11px] text-[#7a8a99]">{stamp}</p>}
    </section>
  );
}

const stampOf = (name: string, at?: string) =>
  at ? `Written by ${name} on ${new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · saved to your account` : undefined;

function List({ heading, items, tone }: { heading: string; items?: Item[]; tone?: string }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <p className={`text-xs font-semibold uppercase tracking-wide ${tone || "text-[#2E7C83]"}`}>{heading}</p>
      <ul className="mt-1 space-y-1.5">
        {items.map((i, n) => (
          <li key={n} className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
            <span className="font-medium">{i.title}</span>
            {(i.detail || i.why) && <span className="text-[#5a6472] dark:text-[#c3ccd8]"> — {i.detail || i.why}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Loads the stored result for a panel and runs a fresh one on request.
function useStored<T>(url: string) {
  const [name, setName] = useState("Your assistant");
  const [needsKey, setNeedsKey] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d?.assistantName) setName(d.assistantName);
        if (d?.hasKey === false) setNeedsKey(true);
        if (d?.latest) setData(d.latest as T);
      })
      .catch(() => undefined);
  }, [url]);
  const run = useCallback(async () => {
    setRunning(true);
    setErr("");
    const { ok, d } = await post(url);
    if (d.needsKey) setNeedsKey(true);
    else if (!ok) setErr(String(d.error || "Couldn't do that."));
    else {
      setData(d as T);
      if (d.assistant) setName(String(d.assistant));
    }
    setRunning(false);
  }, [url]);
  return { name, needsKey, data, running, err, run };
}

/* ───────────── Planning Hub: the briefing ───────────── */
interface Briefing { summary: string; strengths: Item[]; gaps: Item[]; nextMoves: Item[]; assistant?: string; createdAt?: string }

export function PlanningBriefing() {
  const { name, needsKey, data, running, err, run } = useStored<Briefing>("/api/planning/briefing");
  return (
    <Shell name={name} title="planning briefing" blurb="Where your plans stand across business, marketing, sales, forecasting and finance — and what to do next." onRun={run} running={running} hasResult={!!data} runLabel="Brief me" needsKey={needsKey} stamp={stampOf(data?.assistant || name, data?.createdAt)}>
      {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
      {data && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]">{data.summary}</p>
          <List heading="Going well" items={data.strengths} />
          <List heading="Needs attention" items={data.gaps} tone="text-[#8a6a15]" />
          {data.nextMoves?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2E7C83]">Your next three moves</p>
              <ol className="mt-1 space-y-1.5">
                {data.nextMoves.map((m, n) => (
                  <li key={n} className="text-sm">
                    <Link href={m.href || "/planning"} className="inline-flex items-center gap-1 font-medium text-[#2E7C83] hover:underline">
                      {n + 1}. {m.title} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {m.why && <span className="text-[#5a6472] dark:text-[#c3ccd8]"> — {m.why}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

/* ───────────── Forecasting: the read + goals ───────────── */
interface ForecastReadData { summary: string; risks: Item[]; opportunities: Item[]; actions: Item[]; suggestedMonthlyIncomeGoal: number; goalReason: string; assistant?: string; createdAt?: string }

export function ForecastRead() {
  const { name, needsKey, data, running, err, run } = useStored<ForecastReadData>("/api/planning/forecast/insight");
  const [applied, setApplied] = useState<{ monthly: number; week: number; year: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyErr, setApplyErr] = useState("");
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  const apply = async () => {
    if (!data) return;
    setApplying(true);
    setApplyErr("");
    const { ok, d } = await post("/api/planning/forecast/apply", { monthly: data.suggestedMonthlyIncomeGoal });
    if (ok) {
      setApplied({ monthly: Number(d.monthly), week: Number(d.week), year: Number(d.year) });
      window.dispatchEvent(new Event("finance-goals-changed"));
    } else setApplyErr(String(d.error || "Couldn't save the goals."));
    setApplying(false);
  };

  return (
    <Shell name={name} title="forecast read" blurb="What this forecast means for you, measured against your plans, budgets and pipeline." onRun={run} running={running} hasResult={!!data} runLabel="Read my forecast" needsKey={needsKey} stamp={stampOf(data?.assistant || name, data?.createdAt)}>
      {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
      {data && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]">{data.summary}</p>
          <List heading="Watch out for" items={data.risks} tone="text-[#8a6a15]" />
          <List heading="Opportunities" items={data.opportunities} />
          <List heading="This month" items={data.actions} />
          {data.suggestedMonthlyIncomeGoal > 0 && (
            <div className="mt-4 rounded-xl border border-[#2E7C83]/25 bg-white/70 dark:bg-[#0e1830]/40 p-3">
              <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                Suggested income goal: <strong>{usd(data.suggestedMonthlyIncomeGoal)}/month</strong>
                <span className="text-[#5a6472] dark:text-[#c3ccd8]"> ({usd((data.suggestedMonthlyIncomeGoal * 12) / 52)}/week · {usd(data.suggestedMonthlyIncomeGoal * 12)}/year)</span>
              </p>
              {data.goalReason && <p className="text-xs text-[#5a6472] dark:text-[#c3ccd8] mt-1">{data.goalReason}</p>}
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <button onClick={apply} disabled={applying || !!applied} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#1a2b4a] text-white hover:bg-[#1a2b4a]/90 disabled:opacity-60">
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : applied ? <CheckCircle2 className="w-4 h-4" /> : null}
                  {applied ? "Goals set" : "Use as my income goals"}
                </button>
                {applied && <span className="text-xs text-[#2c6b3f]">Your Financial Pulse now tracks {usd(applied.week)}/week, {usd(applied.monthly)}/month and {usd(applied.year)}/year.</span>}
                {!applied && <span className="text-xs text-[#7a8a99]">Feeds the Financial Pulse on your dashboard.</span>}
              </div>
              {applyErr && <p className="text-xs text-[#8a2f2f] mt-1">{applyErr}</p>}
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

/* ───────────── Sales Plan: weekly targets ───────────── */
const TYPE_LABEL: Record<string, string> = { call: "Calls", followup: "Follow-ups", email: "Emails", dm: "DMs", meeting: "Meetings", demo: "Demos", proposal: "Proposals" };
interface Suggest { targets: Record<string, number>; rationale: string; current: Record<string, number>; assistant?: string }

export function SalesTargetsAssist() {
  const [name, setName] = useState("Your assistant");
  const [needsKey, setNeedsKey] = useState(false);
  const [data, setData] = useState<Suggest | null>(null);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/ai-settings").then((r) => r.json()).then((d) => d?.assistantName && setName(String(d.assistantName))).catch(() => undefined);
  }, []);

  const run = async () => {
    setRunning(true);
    setErr("");
    setDone(false);
    const { ok, d } = await post("/api/plans/sales-goals");
    if (d.needsKey) setNeedsKey(true);
    else if (!ok) setErr(String(d.error || "Couldn't suggest targets."));
    else {
      setData(d as unknown as Suggest);
      if (d.assistant) setName(String(d.assistant));
    }
    setRunning(false);
  };
  const apply = async () => {
    if (!data) return;
    setApplying(true);
    setErr("");
    try {
      for (const [type, target] of Object.entries(data.targets)) {
        await fetch("/api/sales-activities", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "goal", type, target }) });
      }
      setDone(true);
    } catch {
      setErr("Couldn't save the targets.");
    }
    setApplying(false);
  };

  return (
    <Shell name={name} title="weekly sales targets" blurb="Activity targets worked backwards from your Sales Plan, income goals and pipeline — they become your weekly goals." onRun={run} running={running} hasResult={!!data} runLabel="Suggest my targets" needsKey={needsKey}>
      {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
      {data && (
        <>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(data.targets).map(([t, n]) => (
              <div key={t} className="rounded-lg bg-white/70 dark:bg-[#0e1830]/40 border border-[#2E7C83]/20 px-3 py-2 text-center">
                <p className="text-xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{n}<span className="text-xs font-normal text-[#7a8a99]">/wk</span></p>
                <p className="text-xs text-[#5a6472] dark:text-[#c3ccd8]">{TYPE_LABEL[t] || t}{data.current[t] != null ? ` · now ${data.current[t]}` : ""}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{data.rationale}</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button onClick={apply} disabled={applying || done} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#1a2b4a] text-white hover:bg-[#1a2b4a]/90 disabled:opacity-60">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4" /> : null}
              {done ? "Targets set" : "Use as my weekly goals"}
            </button>
            <span className="text-xs text-[#7a8a99]">{done ? "Now showing in Sales Activities, your Weekly View and Today's Activity." : "Feeds Sales Activities and your Weekly View."}</span>
          </div>
        </>
      )}
    </Shell>
  );
}

/* ───────────── Budget: suggest from real spending ───────────── */
interface BudgetSuggestion { budget: { category: string; amount: number; average: number; note: string }[]; summary: string; assistant?: string }

export function BudgetSuggest({ onApplied }: { onApplied: () => void }) {
  const [name, setName] = useState("Your assistant");
  const [needsKey, setNeedsKey] = useState(false);
  const [data, setData] = useState<BudgetSuggestion | null>(null);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  useEffect(() => {
    fetch("/api/ai-settings").then((r) => r.json()).then((d) => d?.assistantName && setName(String(d.assistantName))).catch(() => undefined);
  }, []);

  const run = async () => {
    setRunning(true);
    setErr("");
    setDone(false);
    const { ok, d } = await post("/api/finance/budgets/suggest");
    if (d.needsKey) setNeedsKey(true);
    else if (!ok) setErr(String(d.error || "Couldn't suggest a budget."));
    else {
      setData(d as unknown as BudgetSuggestion);
      if (d.assistant) setName(String(d.assistant));
    }
    setRunning(false);
  };
  const apply = async () => {
    if (!data) return;
    setApplying(true);
    setErr("");
    try {
      for (const b of data.budget) {
        await fetch("/api/finance/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "expense", category: b.category, amount: b.amount }) });
      }
      setDone(true);
      onApplied();
    } catch {
      setErr("Couldn't save the budget.");
    }
    setApplying(false);
  };

  return (
    <Shell name={name} title="budget suggestion" blurb="A monthly budget built from what you actually spent, shaped by your plans and forecast." onRun={run} running={running} hasResult={!!data} runLabel="Suggest a budget" needsKey={needsKey}>
      {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
      {data && (
        <>
          <p className="mt-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{data.summary}</p>
          <ul className="mt-2 divide-y divide-[#2E7C83]/15">
            {data.budget.map((b) => (
              <li key={b.category} className="py-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">{b.category}{b.note && <span className="text-xs text-[#5a6472] dark:text-[#c3ccd8]"> — {b.note}</span>}</span>
                <span className="whitespace-nowrap font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{usd(b.amount)} <span className="text-xs font-normal text-[#7a8a99]">(avg {usd(b.average)})</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <button onClick={apply} disabled={applying || done} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#1a2b4a] text-white hover:bg-[#1a2b4a]/90 disabled:opacity-60">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4" /> : null}
              {done ? "Budget set" : "Use this budget"}
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}

/* ───────────── Alignment: one panel for each read ───────────── */
type Section = { key: string; heading: string; tone?: string };
type InsightData = { summary: string; assistant?: string; createdAt?: string; moves?: Item[]; [k: string]: unknown };

// A stored read from the client's own assistant (Business Alignment briefing,
// Progress, Alignment Profile, Segments, Reviews). `moves` render as next steps
// that can be added straight to the client's task list.
export function InsightPanel({ url, title, blurb, runLabel, sections, prose, footer }: {
  url: string; title: string; blurb: string; runLabel: string; sections: Section[];
  prose?: { key: string; heading: string }[]; // plain-text fields (e.g. the profile's "who you are")
  footer?: (d: InsightData) => ReactNode;
}) {
  const { name, needsKey, data, running, err, run } = useStored<InsightData>(url);
  const [added, setAdded] = useState<Record<number, "busy" | "done">>({});

  const addTask = async (m: Item, n: number) => {
    setAdded((a) => ({ ...a, [n]: "busy" }));
    const { ok } = await post("/api/tasks", { title: (m as { task?: string }).task || m.title, description: m.why || "", status: "today", priority: "medium" });
    setAdded((a) => ({ ...a, [n]: ok ? "done" : undefined as never }));
    if (ok) window.dispatchEvent(new Event("tasks-changed"));
  };

  return (
    <Shell name={name} title={title} blurb={blurb} onRun={run} running={running} hasResult={!!data} runLabel={runLabel} needsKey={needsKey} stamp={stampOf(data?.assistant || name, data?.createdAt)}>
      {err && <p className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
      {data && (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#1a2b4a] dark:text-[#F8F5F0]">{data.summary}</p>
          {(prose ?? []).map((p) =>
            data[p.key] ? (
              <p key={p.key} className="mt-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                <span className="font-semibold text-[#2E7C83]">{p.heading}. </span>
                {String(data[p.key])}
              </p>
            ) : null
          )}
          {sections.map((s) => (
            <List key={s.key} heading={s.heading} items={data[s.key] as Item[] | undefined} tone={s.tone} />
          ))}
          {data.moves && data.moves.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2E7C83]">Your next three moves</p>
              <ol className="mt-1 space-y-2">
                {data.moves.map((m, n) => (
                  <li key={n} className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link href={m.href || "/"} className="inline-flex items-center gap-1 font-medium text-[#2E7C83] hover:underline">
                      {n + 1}. {m.title} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {m.why && <span className="text-[#5a6472] dark:text-[#c3ccd8]">— {m.why}</span>}
                    <button
                      onClick={() => addTask(m, n)}
                      disabled={!!added[n]}
                      className="ml-auto text-xs font-medium px-2.5 py-1 rounded-lg border border-[#2E7C83]/40 text-[#2E7C83] hover:bg-[#2E7C83]/10 disabled:opacity-70"
                    >
                      {added[n] === "done" ? "✓ Added to Today" : added[n] === "busy" ? "Adding…" : "Add to my tasks"}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {footer?.(data)}
        </>
      )}
    </Shell>
  );
}

export const AlignmentBriefing = () => (
  <InsightPanel
    url="/api/alignment/briefing" title="alignment briefing" runLabel="Brief me"
    blurb="What your score and phase mean for you, what's driving the weakest areas, and three moves you can add to your tasks."
    sections={[{ key: "drivers", heading: "What's driving it" }]}
  />
);
export const ProgressRead = () => (
  <InsightPanel
    url="/api/progress/read" title="progress read" runLabel="Read my progress"
    blurb="What has actually moved since your baseline — and why."
    sections={[{ key: "wins", heading: "Moving forward" }, { key: "slips", heading: "Stalled", tone: "text-[#8a6a15]" }, { key: "next", heading: "To keep it going" }]}
  />
);
export const ProfileRead = () => (
  <InsightPanel
    url="/api/assessments/profile" title="alignment profile" runLabel="Write my profile"
    blurb="A portrait of you and your business, written from your Brain, Soul and Profit answers. Every AI feature in the Suite starts from it."
    prose={[{ key: "who", heading: "Who you are" }, { key: "business", heading: "How your business runs" }, { key: "money", heading: "The money" }]}
    sections={[{ key: "strengths", heading: "Strengths" }, { key: "tensions", heading: "Where things pull apart", tone: "text-[#8a6a15]" }]}
    footer={(d) => (d.unanswered ? <p className="mt-3 text-xs text-[#5a6472] dark:text-[#c3ccd8]">To sharpen it: {String(d.unanswered)}</p> : null)}
  />
);
export const SegmentRead = () => (
  <InsightPanel
    url="/api/segments/read" title="segment read" runLabel="Read my segments"
    blurb="How your businesses and segments compare, and where to put attention."
    sections={[{ key: "focus", heading: "Focus" }, { key: "risks", heading: "Watch", tone: "text-[#8a6a15]" }, { key: "next", heading: "Next steps" }]}
  />
);
export const SocialProofRead = () => (
  <InsightPanel
    url="/api/reviews/read" title="social-proof read" runLabel="Read my reviews"
    blurb="What your clients say, the lines worth using in your marketing, and what proof is missing."
    sections={[{ key: "themes", heading: "What clients value" }, { key: "quotes", heading: "Lines to use" }, { key: "gaps", heading: "Missing proof", tone: "text-[#8a6a15]" }, { key: "next", heading: "Next steps" }]}
  />
);
