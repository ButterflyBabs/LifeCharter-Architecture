import { createServerClient } from "@/lib/supabase/server";
import { nowParts, MONTHS } from "@/lib/finance/period";
import { loadIncomeGoals } from "@/lib/finance/goals";

// The Financial Pulse numbers for one client: income this week / month / year
// in their time zone against their goals. Shared by the dashboard card and the
// AI assistant so they always agree.

export type Bar = { label: string; value: number };
export type PeriodOut = {
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


export interface PulseResult {
  hasData: boolean;
  thisMonth: number;
  lastMonth: number;
  changePct: number | null;
  weekly: number[];
  periods: { week: PeriodOut; month: PeriodOut; year: PeriodOut };
}

// segmentIds: limit income to one business's segments (the header business switcher).
export async function computePulse(masterPlanId: string, tz: string, segmentIds?: number[]): Promise<PulseResult | { error: string }> {
  const supabase = createServerClient();
  let q = supabase
    .from("finance_entries")
    .select("amount, occurred_on")
    .eq("type", "income")
    .eq("master_plan_id", masterPlanId);
  if (segmentIds) q = q.in("segment_id", segmentIds.length ? segmentIds : [-1]);
  const { data, error } = await q;

  if (error) return { error: error.message };
  const rows = ((data ?? []) as { amount: number | string | null; occurred_on: string }[]).map((r) => ({
    amount: Number(r.amount ?? 0),
    day: String(r.occurred_on).slice(0, 10),
  }));

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
  const [incomeGoals, { data: goals }] = await Promise.all([
    loadIncomeGoals(masterPlanId, supabase),
    supabase.from("finance_goals").select("period, amount").eq("master_plan_id", masterPlanId),
  ]);
  // This month's goal: the month's own goal if the account set one, else its general monthly goal.
  const monthGoal = incomeGoals.forMonth(monthKey);
  const monthOwn = incomeGoals.months.has(monthKey);
  const explicit = (p: "week" | "year") => {
    const v = Number((goals ?? []).find((g) => g.period === p)?.amount ?? 0);
    return v > 0 ? v : null;
  };
  const yearGoalSet = explicit("year");
  const weekGoalSet = explicit("week");
  // The year: an explicit yearly goal, else the sum of this calendar year's month goals, else 12 x the monthly goal.
  const fromMonths = incomeGoals.yearFromMonths(year);
  const yearGoal = yearGoalSet ?? fromMonths ?? (monthGoal ? monthGoal * 12 : null);
  // The week: an explicit weekly goal, else this month's goal spread over its weeks.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  monthOut.goal = monthGoal;
  monthOut.goalSource = monthGoal ? "set" : null;
  yearOut.goal = yearGoal;
  yearOut.goalSource = yearGoalSet ? "set" : yearGoal ? "derived" : null;
  week.goal = weekGoalSet ?? (monthGoal ? Math.round((monthGoal * 7) / daysInMonth) : yearGoal ? Math.round(yearGoal / 52) : null);
  week.goalSource = weekGoalSet ? "set" : week.goal ? "derived" : null;
  void monthOwn;

  for (const p of [week, monthOut, yearOut]) {
    p.changePct = p.prevIncome > 0 ? Math.round(((p.income - p.prevIncome) / p.prevIncome) * 100) : null;
    p.pct = p.goal ? Math.round((p.income / p.goal) * 100) : null;
  }

  return {
    hasData: rows.length > 0,
    // Legacy fields (Morning Brief and older callers).
    thisMonth: monthOut.income,
    lastMonth: monthOut.prevIncome,
    changePct: monthOut.changePct,
    weekly: monthOut.series.map((b) => b.value),
    // Selectable periods for the card.
    periods: { week, month: monthOut, year: yearOut },
  };
}
