// Cascading goals: a plan's yearly goal breaks into quarter → month → week goals.
// Browser-safe (no database access).

export type GoalPeriod = "year" | "quarter" | "month" | "week";
export const CHILD_OF: Record<GoalPeriod, GoalPeriod | null> = { year: "quarter", quarter: "month", month: "week", week: null };
export const PERIOD_LABEL: Record<GoalPeriod, string> = { year: "Year", quarter: "Quarter", month: "Month", week: "Week" };

const pad = (n: number) => String(n).padStart(2, "0");

// The start date of the current period of each kind (weeks start Monday).
export function currentStart(period: GoalPeriod, today = new Date()): string {
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  if (period === "year") return `${y}-01-01`;
  if (period === "quarter") return `${y}-${pad(Math.floor((m - 1) / 3) * 3 + 1)}-01`;
  if (period === "month") return `${y}-${pad(m)}-01`;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// The next few period starts a child goal can be placed in.
export function startOptions(period: GoalPeriod, count = 6, today = new Date()): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const first = currentStart(period, today);
  const [y, m, d] = first.split("-").map(Number);
  for (let i = 0; i < count; i++) {
    let t: Date;
    if (period === "quarter") t = new Date(y, m - 1 + i * 3, 1);
    else if (period === "month") t = new Date(y, m - 1 + i, 1);
    else t = new Date(y, m - 1, d + i * 7);
    const value = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    out.push({ value, label: periodLabel(period, value) });
  }
  return out;
}

export function periodLabel(period: GoalPeriod, start: string | null): string {
  if (!start) return PERIOD_LABEL[period];
  const [y, m, d] = start.split("-").map(Number);
  const t = new Date(y, m - 1, d);
  if (period === "year") return String(y);
  if (period === "quarter") return `Q${Math.floor((m - 1) / 3) + 1} ${y}`;
  if (period === "month") return t.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return `Week of ${t.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
