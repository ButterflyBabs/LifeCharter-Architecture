"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Mountain, Plus, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CHILD_OF, PERIOD_LABEL, currentStart, periodLabel, startOptions, type GoalPeriod } from "@/lib/goalLadder";

interface Plan {
  id: string;
  plan_type: string;
  title: string | null;
}
interface Goal {
  id: string;
  plan_id: string;
  parent_id: string | null;
  period: GoalPeriod;
  period_start: string | null;
  title: string;
  target: string | null;
  status: string | null;
}

const STATUS: { value: string; label: string; color: string }[] = [
  { value: "not_started", label: "Not started", color: "#8a7f74" },
  { value: "in_progress", label: "In progress", color: "#1c5a60" },
  { value: "met", label: "Met", color: "#2c6b3f" },
  { value: "slipped", label: "Slipped", color: "#8a2f2f" },
];
const PLAN_LABEL: Record<string, string> = { business: "Business Plan", marketing: "Marketing Plan", sales: "Sales Plan", finance: "Financial Plan" };

export default function GoalLadderPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", target: "", periodStart: "" });
  const [suggest, setSuggest] = useState<Record<string, { title: string; target: string }[]>>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [onlyNow, setOnlyNow] = useState(false);

  const load = useCallback(async () => {
    const d = await fetch("/api/goals/ladder", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setPlans(d.plans ?? []);
    setGoals(d.goals ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const kids = useMemo(() => {
    const m = new Map<string, Goal[]>();
    for (const g of goals) if (g.parent_id) m.set(g.parent_id, [...(m.get(g.parent_id) ?? []), g]);
    for (const list of Array.from(m.values())) list.sort((a, b) => (a.period_start ?? "").localeCompare(b.period_start ?? ""));
    return m;
  }, [goals]);

  // Share of a goal's breakdown that's met (all levels below it).
  const rollup = useCallback(
    (id: string): { met: number; total: number } => {
      let met = 0;
      let total = 0;
      for (const c of kids.get(id) ?? []) {
        total++;
        if (c.status === "met") met++;
        const r = rollup(c.id);
        met += r.met;
        total += r.total;
      }
      return { met, total };
    },
    [kids]
  );

  const nowStarts: Record<GoalPeriod, string> = {
    year: currentStart("year"),
    quarter: currentStart("quarter"),
    month: currentStart("month"),
    week: currentStart("week"),
  };
  const isNow = (g: Goal) => g.period === "year" || g.period_start === nowStarts[g.period];

  async function setStatus(g: Goal, status: string) {
    setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, status } : x)));
    await fetch("/api/plans/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goalId: g.id, status }) });
  }

  async function add(parent: Goal, item?: { title: string; target: string }) {
    const childPeriod = CHILD_OF[parent.period];
    if (!childPeriod) return;
    const payload = item
      ? { title: item.title, target: item.target, periodStart: draft.periodStart || startOptions(childPeriod, 1)[0].value }
      : draft;
    if (!payload.title.trim()) return setMsg("Give the goal a title.");
    setBusy(`add:${parent.id}`);
    const r = await fetch("/api/goals/ladder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", parentId: parent.id, ...payload, periodStart: payload.periodStart || startOptions(childPeriod, 1)[0].value }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (!r.ok) return setMsg(d.error || "Couldn't save that goal.");
    setGoals((gs) => [...gs, d.goal]);
    setOpen((o) => ({ ...o, [parent.id]: true }));
    if (item) setSuggest((s) => ({ ...s, [parent.id]: (s[parent.id] ?? []).filter((x) => x.title !== item.title) }));
    else {
      setDraft({ title: "", target: "", periodStart: "" });
      setAdding(null);
    }
  }

  async function getSuggestions(parent: Goal) {
    setBusy(`suggest:${parent.id}`);
    setMsg("");
    const r = await fetch("/api/goals/ladder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suggest", parentId: parent.id }) });
    const d = await r.json().catch(() => ({}));
    setBusy("");
    if (d.needsKey) return setMsg("Connect your AI in Settings → AI to get suggestions.");
    setSuggest((s) => ({ ...s, [parent.id]: d.suggestions ?? [] }));
  }

  async function remove(g: Goal) {
    if (!confirm(`Remove "${g.title}" and anything under it?`)) return;
    await fetch("/api/goals/ladder", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: g.id }) });
    void load();
  }

  function Node({ g, depth }: { g: Goal; depth: number }) {
    const children = (kids.get(g.id) ?? []).filter((c) => !onlyNow || isNow(c));
    const r = rollup(g.id);
    const childPeriod = CHILD_OF[g.period];
    const expanded = open[g.id] ?? depth < 1;
    const st = STATUS.find((s) => s.value === (g.status || "not_started")) ?? STATUS[0];
    return (
      <div className={depth ? "ml-5 border-l border-[#1a2b4a]/10 pl-4" : ""}>
        <div className="flex flex-wrap items-center gap-2 py-2">
          <button onClick={() => setOpen((o) => ({ ...o, [g.id]: !expanded }))} className="text-[#7a8a99]" aria-label={expanded ? "Collapse" : "Expand"}>
            {kids.get(g.id)?.length ? expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" /> : <span className="inline-block w-4" />}
          </button>
          <span className="rounded-full bg-[#1a2b4a]/8 px-2 py-0.5 text-[11px] font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
            {g.period === "year" ? "Year" : periodLabel(g.period, g.period_start)}
          </span>
          <span className="min-w-0 flex-1 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
            {g.title}
            {g.target && <span className="ml-2 text-xs text-[#7a8a99]">· {g.target}</span>}
          </span>
          {r.total > 0 && <span className="text-xs text-[#7a8a99]">{r.met}/{r.total} steps met</span>}
          <select
            value={g.status || "not_started"}
            onChange={(e) => setStatus(g, e.target.value)}
            className="h-8 rounded-lg border border-[#1a2b4a]/15 bg-white dark:bg-[#1a2b4a]/20 px-2 text-xs font-semibold"
            style={{ color: st.color }}
            aria-label="Status"
          >
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {childPeriod && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(adding === g.id ? null : g.id); setDraft({ title: "", target: "", periodStart: startOptions(childPeriod, 1)[0].value }); }}>
                <Plus className="w-3.5 h-3.5 mr-1" />{PERIOD_LABEL[childPeriod]} goal
              </Button>
              <Button size="sm" variant="ghost" disabled={busy === `suggest:${g.id}`} onClick={() => getSuggestions(g)} aria-label="Suggest smaller goals">
                {busy === `suggest:${g.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              </Button>
            </>
          )}
          {g.period !== "year" && (
            <Button size="sm" variant="ghost" onClick={() => remove(g)} aria-label="Remove"><Trash2 className="w-3.5 h-3.5" /></Button>
          )}
        </div>
        {adding === g.id && childPeriod && (
          <div className="ml-5 mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-[#1a2b4a]/5 p-3">
            <Input className="min-w-[220px] flex-1" placeholder={`${PERIOD_LABEL[childPeriod]} goal`} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <Input className="w-48" placeholder="Target (optional)" value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} />
            <select value={draft.periodStart} onChange={(e) => setDraft({ ...draft, periodStart: e.target.value })} className="h-10 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-2 text-sm" aria-label="When">
              {startOptions(childPeriod, childPeriod === "week" ? 8 : 6).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button size="sm" onClick={() => add(g)} disabled={busy === `add:${g.id}`}>Add</Button>
          </div>
        )}
        {!!suggest[g.id]?.length && childPeriod && (
          <div className="ml-5 mb-2 rounded-xl border border-dashed border-[#c9a227]/50 p-3 space-y-2">
            <p className="text-xs font-semibold text-[#8a6a15]">Suggested {PERIOD_LABEL[childPeriod].toLowerCase()} goals: add the ones that fit</p>
            {suggest[g.id].map((s) => (
              <div key={s.title} className="flex items-center gap-2 text-sm">
                <span className="flex-1 text-[#1a2b4a] dark:text-[#F8F5F0]">{s.title}{s.target && <span className="text-xs text-[#7a8a99]"> · {s.target}</span>}</span>
                <Button size="sm" variant="outline" onClick={() => add(g, s)}>Add</Button>
              </div>
            ))}
          </div>
        )}
        {expanded && children.map((c) => <Node key={c.id} g={c} depth={depth + 1} />)}
      </div>
    );
  }

  const roots = goals.filter((g) => !g.parent_id && g.period === "year");

  return (
    <div className="py-8 px-4 max-w-5xl mx-auto">
      <Link href="/planning" className="inline-flex items-center gap-1 text-sm text-[#2E7C83] hover:underline mb-3">
        <ArrowLeft className="w-4 h-4" /> Planning Hub
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a9b9b] to-[#1a2b4a] flex items-center justify-center">
            <Mountain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Goal Ladder</h1>
            <p className="text-[#7a8a99]">Your year&apos;s goals, broken into this quarter, this month and this week.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
          <input type="checkbox" checked={onlyNow} onChange={(e) => setOnlyNow(e.target.checked)} className="h-4 w-4" />
          Show only what&apos;s current
        </label>
      </div>
      {msg && <p className="mb-4 rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-sm">{msg}</p>}
      {plans === null ? (
        <p className="text-[#7a8a99]">Loading…</p>
      ) : !roots.length ? (
        <Card>
          <CardContent className="p-6 text-[#1a2b4a] dark:text-[#F8F5F0]">
            Your yearly goals come from your plans. Build your <Link href="/business-plan" className="underline">Business Plan</Link> (or Marketing or Sales Plan) and its goals will
            appear here, ready to break down.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {plans.map((p) => {
            const mine = roots.filter((g) => g.plan_id === p.id);
            if (!mine.length) return null;
            return (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">{PLAN_LABEL[p.plan_type] || p.title || "Plan"}</p>
                  {mine.map((g) => <Node key={g.id} g={g} depth={0} />)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
