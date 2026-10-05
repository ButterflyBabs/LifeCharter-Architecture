import { createServerClient } from "@/lib/supabase/server";
import { computeForecast, type ForecastAssumptions, type ForecastResult, type RevenuePlan } from "@/lib/forecast";
import { loadIncomeGoals } from "@/lib/finance/goals";
import { DEAL_COLUMNS, shapeDeal, shapeStage } from "@/lib/sales/pipeline";

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
async function buildActualsForecast(
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

  const base = await loadAssumptions(masterPlanId);
  const assumptions: ForecastAssumptions = { ...base, ...(overrides || {}) };

  // Open pipeline: this account's Pipeline board when it has deals (each deal's own value and
  // probability; only deals expected to close within the forecast period, or undated).
  const [{ data: stageRows }, { data: dealRows }] = await Promise.all([
    supabase.from("pipeline_stages").select("id, name, kind, probability, sort_order").eq("master_plan_id", masterPlanId),
    supabase.from("pipeline_deals").select(DEAL_COLUMNS).eq("master_plan_id", masterPlanId),
  ]);
  const stageMap = new Map(((stageRows ?? []) as Record<string, unknown>[]).map(shapeStage).map((s) => [s.id, s]));
  const horizonEnd = new Date();
  horizonEnd.setUTCMonth(horizonEnd.getUTCMonth() + Math.max(1, Math.round(assumptions.horizonMonths)));
  const horizonEndStr = horizonEnd.toISOString().slice(0, 10);
  const openDeals = ((dealRows ?? []) as Record<string, unknown>[])
    .map((r) => shapeDeal(r, stageMap))
    .filter((d) => stageMap.get(d.stageId)?.kind === "open" && (!d.expectedClose || d.expectedClose <= horizonEndStr));
  if (openDeals.length > 0) {
    return computeForecast(
      {
        monthlyIncome,
        monthlyExpense,
        openPipelineValue: openDeals.reduce((s, d) => s + (d.value ?? 0), 0),
        weightedPipelineValue: openDeals.reduce((s, d) => s + d.weightedValue, 0),
        pipelineDeals: openDeals.length,
      },
      assumptions
    );
  }

  // No Pipeline deals yet: open value from Sales Activities, with the flat close % assumption.
  const { data: acts } = await supabase
    .from("sales_activities")
    .select("estimated_value, outcome")
    .eq("master_plan_id", masterPlanId);
  let openPipelineValue = 0;
  for (const a of (acts || []) as { estimated_value: number | string | null; outcome: string | null }[]) {
    if (a.outcome === "won" || a.outcome === "lost") continue;
    openPipelineValue += Number(a.estimated_value ?? 0);
  }

  return computeForecast({ monthlyIncome, monthlyExpense, openPipelineValue }, assumptions);
}

// With no income recorded yet, the forecast would be all zeros. If the client has income goals (for example the
// month-by-month ramp from their revenue model), show those as a revenue plan instead. Recorded income always wins.
export async function buildForecast(masterPlanId: string, overrides?: Partial<ForecastAssumptions>): Promise<ForecastResult> {
  const result = await buildActualsForecast(masterPlanId, overrides);
  if (result.baseMonthlyRevenue > 0) return result;
  try {
    const supabase = createServerClient();
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - 6);
    const { count } = await supabase
      .from("finance_entries")
      .select("id", { count: "exact", head: true })
      .eq("master_plan_id", masterPlanId)
      .eq("type", "income")
      .gte("occurred_on", since.toISOString().slice(0, 10));
    if ((count ?? 0) > 0) return result;
    const goals = await loadIncomeGoals(masterPlanId, supabase);
    if (goals.general === null && goals.months.size === 0) return result;
    // A month-by-month ramp is shown for at least a year so the whole ramp is visible.
    const horizon = Math.max(1, Math.min(24, Math.max(Math.round(result.assumptions.horizonMonths), goals.months.size > 0 ? 12 : 1)));
    const now = new Date();
    const base: { label: string; revenue: number }[] = [];
    for (let i = 0; i < horizon; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
      const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const goal = goals.forMonth(ym);
      if (goal) base.push({ label: d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }), revenue: goal });
    }
    if (!base.length) return result;
    const mk = (key: "conservative" | "expected" | "optimistic", label: string, factor: number) => {
      let cum = 0;
      const months = base.map((m) => {
        const revenue = Math.round(m.revenue * factor);
        cum += revenue;
        return { label: m.label, revenue, cumulativeRevenue: cum };
      });
      return { key, label, months, totalRevenue: cum };
    };
    const revenuePlan: RevenuePlan = {
      note: goals.months.size > 0
        ? "No income is recorded yet, so this shows your own month-by-month income goals (from your revenue model) as a plan. Expected is the plan as written; Conservative is 80% of it and Optimistic is 120%. It shows revenue only, because expenses are not part of the plan yet. Once you record income, the forecast switches to your actual results."
        : "No income is recorded yet, so this shows your monthly income goal as a plan. Expected is the plan as written; Conservative is 80% of it and Optimistic is 120%. It shows revenue only. Once you record income, the forecast switches to your actual results.",
      scenarios: [mk("conservative", "Conservative", 0.8), mk("expected", "Expected", 1), mk("optimistic", "Optimistic", 1.2)],
    };
    return { ...result, revenuePlan };
  } catch (e) {
    console.error("revenue plan fallback:", e);
    return result;
  }
}
