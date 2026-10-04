import { createServerClient } from "@/lib/supabase/server";

// Income goals. The account has a general monthly goal (finance_budgets: income, category ""), and may also set a
// goal for individual months (finance_month_goals), for example a growth ramp. A month with its own goal uses
// it; every other month uses the general one.
type Db = ReturnType<typeof createServerClient>;

export interface IncomeGoals {
  general: number | null; // the general monthly goal
  months: Map<string, number>; // "YYYY-MM" -> goal for that month
  forMonth: (ym: string) => number | null;
  // The calendar year's goal worked out from its month goals (null when the year has none).
  yearFromMonths: (year: number) => number | null;
}

export async function loadIncomeGoals(planId: string, db: Db = createServerClient()): Promise<IncomeGoals> {
  const [{ data: b }, { data: rows }] = await Promise.all([
    db.from("finance_budgets").select("amount").eq("master_plan_id", planId).eq("type", "income").eq("category", "").maybeSingle(),
    db.from("finance_month_goals").select("month, amount").eq("master_plan_id", planId),
  ]);
  const general = Number(b?.amount ?? 0) || null;
  const months = new Map<string, number>();
  for (const r of (rows ?? []) as { month: string; amount: number | string }[]) {
    const v = Number(r.amount);
    if (v > 0) months.set(r.month, v);
  }
  return {
    general,
    months,
    forMonth: (ym) => months.get(ym) ?? general,
    yearFromMonths: (year) => {
      let sum = 0;
      let any = false;
      for (let m = 1; m <= 12; m++) {
        const v = months.get(`${year}-${String(m).padStart(2, "0")}`);
        if (v) {
          sum += v;
          any = true;
        }
      }
      return any ? sum : null;
    },
  };
}
