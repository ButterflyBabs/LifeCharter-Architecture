import { createServerClient } from "@/lib/supabase/server";
import { nowParts } from "@/lib/finance/period";
import { zonedToUtcISO } from "@/lib/tz";
import { loadBills, occurrences } from "@/lib/finance/bills";

// The guided weekly & monthly review. Its period, the hard numbers the
// assistant briefs from (so the briefing never invents them), and the three
// questions the client answers.

export type ReviewCadence = "weekly" | "monthly";

export const QUESTIONS: Record<ReviewCadence, { id: string; q: string; hint: string }[]> = {
  weekly: [
    { id: "moved", q: "What moved forward this week?", hint: "Wins, finished work, conversations that went well — big or small." },
    { id: "blocked", q: "What got in the way?", hint: "What slowed you down or pulled you off course?" },
    { id: "next", q: "What matters most next week?", hint: "If only one thing got done, what should it be?" },
  ],
  monthly: [
    { id: "proud", q: "What are you proud of this month?", hint: "Results, habits, decisions — what went right?" },
    { id: "lesson", q: "What didn't go to plan, and what did it teach you?", hint: "Name it plainly; the lesson is the useful part." },
    { id: "next", q: "What one outcome would make next month a success?", hint: "Be specific enough that you'd know you hit it." },
  ],
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

export interface ReviewPeriod {
  start: string; // YYYY-MM-DD, inclusive
  end: string; // inclusive
  nextStart: string;
  nextEnd: string;
  label: string;
}

// Weekly reviews cover Monday–Sunday: this week, or last week when it's Monday
// (a Monday-morning review looks back). Monthly reviews cover this month, or last
// month during the first 7 days.
export function periodFor(cadence: ReviewCadence, tz: string): ReviewPeriod {
  const { year, month, day } = nowParts(tz);
  const today = utc(year, month, day);
  const fmt = (d: Date, withYear = false) =>
    d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: withYear ? "numeric" : undefined });
  if (cadence === "weekly") {
    const dow = (today.getUTCDay() + 6) % 7; // Mon=0
    const back = dow === 0 ? 7 : dow;
    const start = utc(year, month, day - back);
    const end = utc(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate() + 6);
    const nextStart = utc(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate() + 1);
    const nextEnd = utc(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 1, nextStart.getUTCDate() + 6);
    return { start: iso(start), end: iso(end), nextStart: iso(nextStart), nextEnd: iso(nextEnd), label: `Week of ${fmt(start)} – ${fmt(end, true)}` };
  }
  const m = day <= 7 ? month - 1 : month;
  const start = utc(year, m, 1);
  const end = utc(start.getUTCFullYear(), start.getUTCMonth() + 2, 0);
  const nextStart = utc(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate() + 1);
  const nextEnd = utc(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 2, 0);
  return {
    start: iso(start),
    end: iso(end),
    nextStart: iso(nextStart),
    nextEnd: iso(nextEnd),
    label: start.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" }),
  };
}

export interface ReviewNumbers {
  income: number;
  expenses: number;
  incomeGoal: number | null;
  tasksDone: number;
  tasksOverdue: number;
  dealsAdded: number;
  dealsClosed: number;
  openPipeline: number;
  billsNextPeriod: number;
  billsNextCount: number;
  goals: { met: number; inProgress: number; slipped: number; notStarted: number };
  scoreNow: number | null;
  scoreChange: number | null;
}

// Live numbers for the period, straight from the client's own data.
export async function gatherNumbers(masterPlanId: string, p: ReviewPeriod, tz: string, cadence: ReviewCadence): Promise<ReviewNumbers> {
  const db = createServerClient();
  const startTs = zonedToUtcISO(p.start, "00:00", tz);
  const endTs = zonedToUtcISO(p.nextStart, "00:00", tz);
  const n: ReviewNumbers = {
    income: 0,
    expenses: 0,
    incomeGoal: null,
    tasksDone: 0,
    tasksOverdue: 0,
    dealsAdded: 0,
    dealsClosed: 0,
    openPipeline: 0,
    billsNextPeriod: 0,
    billsNextCount: 0,
    goals: { met: 0, inProgress: 0, slipped: 0, notStarted: 0 },
    scoreNow: null,
    scoreChange: null,
  };

  await Promise.all([
    (async () => {
      const { data } = await db.from("finance_entries").select("type, amount").eq("master_plan_id", masterPlanId).gte("occurred_on", p.start).lte("occurred_on", p.end);
      for (const r of (data || []) as { type: string; amount: number | string | null }[]) {
        if (r.type === "income") n.income += Number(r.amount ?? 0);
        else n.expenses += Number(r.amount ?? 0);
      }
      const { data: goals } = await db.from("finance_goals").select("period, amount").eq("master_plan_id", masterPlanId);
      const want = cadence === "weekly" ? "week" : "month";
      const g = Number(((goals || []) as { period: string; amount: number }[]).find((x) => x.period === want)?.amount ?? 0);
      if (g > 0) n.incomeGoal = g;
      else if (cadence === "monthly") {
        const { data: b } = await db.from("finance_budgets").select("amount").eq("master_plan_id", masterPlanId).eq("type", "income").eq("category", "").maybeSingle();
        if (Number(b?.amount) > 0) n.incomeGoal = Number(b?.amount);
      }
    })(),
    (async () => {
      const { count } = await db.from("tasks").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId).eq("status", "done").gte("completed_at", startTs).lt("completed_at", endTs);
      n.tasksDone = count ?? 0;
      const { count: od } = await db.from("tasks").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId).neq("status", "done").lt("due_at", new Date().toISOString());
      n.tasksOverdue = od ?? 0;
    })(),
    (async () => {
      const { data } = await db.from("pipeline_deals").select("value, created_at, closed_at").eq("master_plan_id", masterPlanId);
      for (const d of (data || []) as { value: number | null; created_at: string; closed_at: string | null }[]) {
        if (d.created_at >= startTs && d.created_at < endTs) n.dealsAdded++;
        if (d.closed_at && d.closed_at >= startTs && d.closed_at < endTs) n.dealsClosed++;
        if (!d.closed_at) n.openPipeline += Number(d.value ?? 0);
      }
    })(),
    (async () => {
      const occ = occurrences(await loadBills(masterPlanId), p.nextStart, p.nextEnd);
      n.billsNextCount = occ.length;
      n.billsNextPeriod = occ.reduce((s, o) => s + (o.bill.amount || 0), 0);
    })(),
    (async () => {
      const { data: plans } = await db.from("client_plans").select("id").eq("master_plan_id", masterPlanId).eq("status", "active");
      const ids = ((plans || []) as { id: string }[]).map((x) => x.id);
      if (!ids.length) return;
      const { data } = await db.from("client_plan_goals").select("status").in("plan_id", ids);
      for (const g of (data || []) as { status: string | null }[]) {
        if (g.status === "met") n.goals.met++;
        else if (g.status === "in_progress") n.goals.inProgress++;
        else if (g.status === "slipped") n.goals.slipped++;
        else n.goals.notStarted++;
      }
    })(),
    (async () => {
      const { data } = await db.from("client_score_snapshots").select("overall, created_at").eq("master_plan_id", masterPlanId).order("created_at", { ascending: false }).limit(60);
      const snaps = (data || []) as { overall: number | null; created_at: string }[];
      if (!snaps.length) return;
      n.scoreNow = snaps[0].overall;
      const before = snaps.find((s) => s.created_at < startTs);
      if (before && before.overall !== null && n.scoreNow !== null) n.scoreChange = n.scoreNow - before.overall;
    })(),
  ]);
  n.income = Math.round(n.income);
  n.expenses = Math.round(n.expenses);
  n.openPipeline = Math.round(n.openPipeline);
  n.billsNextPeriod = Math.round(n.billsNextPeriod);
  return n;
}

const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export function numbersText(n: ReviewNumbers, cadence: ReviewCadence): string {
  const per = cadence === "weekly" ? "this week" : "this month";
  const nxt = cadence === "weekly" ? "next week" : "next month";
  return [
    `Income ${per}: ${usd(n.income)}${n.incomeGoal ? ` of a ${usd(n.incomeGoal)} goal` : ""}; expenses ${usd(n.expenses)}.`,
    `Tasks finished ${per}: ${n.tasksDone}; open tasks now overdue: ${n.tasksOverdue}.`,
    `Pipeline: ${n.dealsAdded} new deal(s), ${n.dealsClosed} closed ${per}; ${usd(n.openPipeline)} still open.`,
    `Bills due ${nxt}: ${n.billsNextCount} (${usd(n.billsNextPeriod)}).`,
    `Plan goals: ${n.goals.met} met, ${n.goals.inProgress} in progress, ${n.goals.slipped} slipped, ${n.goals.notStarted} not started.`,
    n.scoreNow !== null ? `Alignment score: ${n.scoreNow}${n.scoreChange !== null ? ` (${n.scoreChange >= 0 ? "+" : ""}${n.scoreChange} over the period)` : ""}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
