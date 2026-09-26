import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { nowParts, MONTHS } from "@/lib/finance/period";

// Always query live data per request (never prerender/cache the aggregate).
export const dynamic = "force-dynamic";

// Financial Pulse data for the Executive Home and Morning Brief.
//
// Income comes from the finance ledger (finance_entries), scoped to the
// signed-in client's own plan. "This week / month / year" follow the viewer's
// time zone; weeks run Sunday→Saturday like the Finance reports. Goals: the
// monthly goal is the income target set in Finance → Budget; weekly and yearly
// goals are explicit when set (finance_goals), else derived from the monthly
// one (year = 12 × month, week = year ÷ 52).

type Bar = { label: string; value: number };
type PeriodOut = {
  income: number;
  prevIncome: number;
  changePct: number | null;
  goal: number | null;
  goalSource: "set" | "derived" | null;
  pct: number | null;
  series: Bar[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(request: Request) {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ hasData: false });

  const { data, error } = await supabase
    .from("finance_entries")
    .select("amount, occurred_on")
    .eq("type", "income")
    .eq("master_plan_id", masterPlanId);

  if (error) {
    console.error("GET /api/financial-pulse:", error.message);
    return NextResponse.json({ hasData: false, error: error.message }, { status: 200 });
  }
  const rows = ((data ?? []) as { amount: number | string | null; occurred_on: string }[]).map((r) => ({
    amount: Number(r.amount ?? 0),
    day: String(r.occurred_on).slice(0, 10),
  }));

  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const { year, month, day } = nowParts(tz);
  const today = `${year}-${pad(month)}-${pad(day)}`;
  const todayDate = new Date(Date.UTC(year, month - 1, day));

  // ── Period bounds (inclusive text dates; "to date" stops at today) ──────
  const weekStart = addDays(todayDate, -todayDate.getUTCDay());
  const prevWeekStart = addDays(weekStart, -7);
  const monthKey = `${year}-${pad(month)}`;
  const prevMonthKey = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
  const yearKey = String(year);
  const prevYearKey = String(year - 1);

  const wStart = ymd(weekStart);
  const pwStart = ymd(prevWeekStart);
  const pwEnd = ymd(addDays(weekStart, -1));

  const sum = (pred: (d: string) => boolean) =>
    rows.reduce((t, r) => (pred(r.day) ? t + r.amount : t), 0);

  const week: PeriodOut = {
    income: sum((d) => d >= wStart && d <= today),
    prevIncome: sum((d) => d >= pwStart && d <= pwEnd),
    changePct: null, goal: null, goalSource: null, pct: null,
    series: DAYS.map((label, i) => ({ label, value: sum((d) => d === ymd(addDays(weekStart, i))) })),
  };
  const monthOut: PeriodOut = {
    income: sum((d) => d.startsWith(monthKey) && d <= today),
    prevIncome: sum((d) => d.startsWith(prevMonthKey)),
    changePct: null, goal: null, goalSource: null, pct: null,
    series: [0, 1, 2, 3].map((w) => ({
      label: `Week ${w + 1}`,
      value: sum((d) => d.startsWith(monthKey) && d <= today && Math.min(3, Math.floor((Number(d.slice(8, 10)) - 1) / 7)) === w),
    })),
  };
  const yearOut: PeriodOut = {
    income: sum((d) => d.startsWith(yearKey) && d <= today),
    prevIncome: sum((d) => d.startsWith(prevYearKey)),
    changePct: null, goal: null, goalSource: null, pct: null,
    series: MONTHS.map((label, i) => ({ label, value: sum((d) => d.startsWith(`${yearKey}-${pad(i + 1)}`) && d <= today) })),
  };

  // ── Goals ────────────────────────────────────────────────────────────────
  const [{ data: budget }, { data: goals }] = await Promise.all([
    supabase.from("finance_budgets").select("amount").eq("master_plan_id", masterPlanId).eq("type", "income").eq("category", "").maybeSingle(),
    supabase.from("finance_goals").select("period, amount").eq("master_plan_id", masterPlanId),
  ]);
  const monthGoal = Number(budget?.amount ?? 0) || null;
  const explicit = (p: "week" | "year") => {
    const v = Number((goals ?? []).find((g) => g.period === p)?.amount ?? 0);
    return v > 0 ? v : null;
  };
  const yearGoalSet = explicit("year");
  const weekGoalSet = explicit("week");
  const yearGoal = yearGoalSet ?? (monthGoal ? monthGoal * 12 : null);

  monthOut.goal = monthGoal;
  monthOut.goalSource = monthGoal ? "set" : null;
  yearOut.goal = yearGoal;
  yearOut.goalSource = yearGoalSet ? "set" : yearGoal ? "derived" : null;
  week.goal = weekGoalSet ?? (yearGoal ? Math.round(yearGoal / 52) : null);
  week.goalSource = weekGoalSet ? "set" : week.goal ? "derived" : null;

  for (const p of [week, monthOut, yearOut]) {
    p.changePct = p.prevIncome > 0 ? Math.round(((p.income - p.prevIncome) / p.prevIncome) * 100) : null;
    p.pct = p.goal ? Math.round((p.income / p.goal) * 100) : null;
  }

  return NextResponse.json({
    hasData: rows.length > 0,
    // Legacy fields (Morning Brief and older callers).
    thisMonth: monthOut.income,
    lastMonth: monthOut.prevIncome,
    changePct: monthOut.changePct,
    weekly: monthOut.series.map((b) => b.value),
    // Selectable periods for the card.
    periods: { week, month: monthOut, year: yearOut },
  });
}
