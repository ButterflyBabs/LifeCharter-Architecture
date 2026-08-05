import { createServerClient } from "@/lib/supabase/server";
import { computeForecast, type ForecastAssumptions, type ForecastResult } from "@/lib/forecast";

const DEFAULTS: ForecastAssumptions = {
  horizonMonths: 6,
  monthlyGrowthPct: 3,
  pipelineClosePct: 20,
  expenseRatioPct: 0,
};

export async function loadAssumptions(masterPlanId: string): Promise<ForecastAssumptions> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("forecast_assumptions")
    .select("horizon_months, monthly_growth_pct, pipeline_close_pct, expense_ratio_pct")
    .eq("master_plan_id", masterPlanId)
    .maybeSingle();
  if (!data) return { ...DEFAULTS };
  return {
    horizonMonths: Number(data.horizon_months ?? DEFAULTS.horizonMonths),
    monthlyGrowthPct: Number(data.monthly_growth_pct ?? DEFAULTS.monthlyGrowthPct),
    pipelineClosePct: Number(data.pipeline_close_pct ?? DEFAULTS.pipelineClosePct),
    expenseRatioPct: Number(data.expense_ratio_pct ?? DEFAULTS.expenseRatioPct),
  };
}

// Pull trailing monthly income/expense + open pipeline, then compute the forecast.
export async function buildForecast(
  masterPlanId: string,
  overrides?: Partial<ForecastAssumptions>
): Promise<ForecastResult> {
  const supabase = createServerClient();

  // Trailing 6 full months of ledger activity.
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 6);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: entries } = await supabase
    .from("finance_entries")
    .select("type, amount, occurred_on")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", sinceStr);

  // Bucket into the last 6 month keys.
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - i);
    monthKeys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const incomeByMonth: Record<string, number> = {};
  const expenseByMonth: Record<string, number> = {};
  for (const k of monthKeys) {
    incomeByMonth[k] = 0;
    expenseByMonth[k] = 0;
  }
  for (const e of (entries || []) as { type: string; amount: number | string | null; occurred_on: string | null }[]) {
    if (!e.occurred_on) continue;
    const k = e.occurred_on.slice(0, 7);
    if (!(k in incomeByMonth)) continue;
    const amt = Number(e.amount ?? 0);
    if (e.type === "income") incomeByMonth[k] += amt;
    else expenseByMonth[k] += amt;
  }
  const monthlyIncome = monthKeys.map((k) => incomeByMonth[k]);
  const monthlyExpense = monthKeys.map((k) => expenseByMonth[k]);

  // Open pipeline value (still-live opportunities).
  const { data: acts } = await supabase
    .from("sales_activities")
    .select("estimated_value, outcome")
    .eq("master_plan_id", masterPlanId);
  let openPipelineValue = 0;
  for (const a of (acts || []) as { estimated_value: number | string | null; outcome: string | null }[]) {
    if (a.outcome === "won" || a.outcome === "lost") continue;
    openPipelineValue += Number(a.estimated_value ?? 0);
  }

  const base = await loadAssumptions(masterPlanId);
  const assumptions: ForecastAssumptions = { ...base, ...(overrides || {}) };

  return computeForecast({ monthlyIncome, monthlyExpense, openPipelineValue }, assumptions);
}
