// Forecasting engine — pure functions, no I/O. Projects revenue, expenses, and
// net forward from recent actuals + open sales pipeline, under three scenarios.

export interface ForecastAssumptions {
  horizonMonths: number; // how many months to project
  monthlyGrowthPct: number; // expected month-over-month revenue growth
  pipelineClosePct: number; // % of open pipeline expected to close over the horizon
  expenseRatioPct: number; // expenses as % of revenue; 0 = derive from actuals
}

export interface ForecastInputs {
  // Trailing monthly income totals, oldest→newest (up to ~6 months).
  monthlyIncome: number[];
  // Trailing monthly expense totals, oldest→newest.
  monthlyExpense: number[];
  // Sum of open (still-live) pipeline value.
  openPipelineValue: number;
}

export interface MonthProjection {
  monthIndex: number; // 1-based months into the future
  revenue: number;
  expenses: number;
  net: number;
  cumulativeNet: number;
}

export interface ScenarioProjection {
  key: "conservative" | "expected" | "optimistic";
  label: string;
  months: MonthProjection[];
  totalRevenue: number;
  totalExpenses: number;
  totalNet: number;
}

export interface ForecastResult {
  baseMonthlyRevenue: number;
  derivedExpenseRatio: number;
  assumptions: ForecastAssumptions;
  scenarios: ScenarioProjection[];
}

function avg(nums: number[]): number {
  const vals = nums.filter((n) => Number.isFinite(n));
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Base monthly revenue = average of the trailing income (favor the last 3 months
// if we have them, so the base reflects the current run-rate).
function baseRevenue(monthlyIncome: number[]): number {
  if (monthlyIncome.length === 0) return 0;
  const recent = monthlyIncome.slice(-3);
  return avg(recent.length ? recent : monthlyIncome);
}

function projectScenario(
  key: ScenarioProjection["key"],
  label: string,
  base: number,
  growthPct: number,
  closePct: number,
  expenseRatio: number,
  pipeline: number,
  horizon: number
): ScenarioProjection {
  const g = growthPct / 100;
  // Pipeline expected to close over the horizon, spread evenly across months.
  const pipelinePerMonth = horizon > 0 ? (pipeline * (closePct / 100)) / horizon : 0;
  const months: MonthProjection[] = [];
  let cumulative = 0;
  for (let m = 1; m <= horizon; m++) {
    const organic = base * Math.pow(1 + g, m);
    const revenue = organic + pipelinePerMonth;
    const expenses = revenue * expenseRatio;
    const net = revenue - expenses;
    cumulative += net;
    months.push({
      monthIndex: m,
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      net: Math.round(net),
      cumulativeNet: Math.round(cumulative),
    });
  }
  return {
    key,
    label,
    months,
    totalRevenue: months.reduce((s, x) => s + x.revenue, 0),
    totalExpenses: months.reduce((s, x) => s + x.expenses, 0),
    totalNet: months.reduce((s, x) => s + x.net, 0),
  };
}

export function computeForecast(inputs: ForecastInputs, a: ForecastAssumptions): ForecastResult {
  const base = baseRevenue(inputs.monthlyIncome);

  // Expense ratio: use the assumption if set (>0), else derive from actuals.
  const actualIncome = inputs.monthlyIncome.reduce((s, x) => s + x, 0);
  const actualExpense = inputs.monthlyExpense.reduce((s, x) => s + x, 0);
  const derivedRatio = actualIncome > 0 ? Math.min(1.5, actualExpense / actualIncome) : 0.6;
  const expenseRatio = a.expenseRatioPct > 0 ? a.expenseRatioPct / 100 : derivedRatio;

  const horizon = Math.max(1, Math.min(24, Math.round(a.horizonMonths)));

  // Scenario deltas around the expected case.
  const GROWTH_DELTA = 3; // percentage points
  const CLOSE_DELTA = 12; // percentage points

  const scenarios: ScenarioProjection[] = [
    projectScenario(
      "conservative",
      "Conservative",
      base,
      a.monthlyGrowthPct - GROWTH_DELTA,
      Math.max(0, a.pipelineClosePct - CLOSE_DELTA),
      expenseRatio,
      inputs.openPipelineValue,
      horizon
    ),
    projectScenario(
      "expected",
      "Expected",
      base,
      a.monthlyGrowthPct,
      a.pipelineClosePct,
      expenseRatio,
      inputs.openPipelineValue,
      horizon
    ),
    projectScenario(
      "optimistic",
      "Optimistic",
      base,
      a.monthlyGrowthPct + GROWTH_DELTA,
      Math.min(100, a.pipelineClosePct + CLOSE_DELTA),
      expenseRatio,
      inputs.openPipelineValue,
      horizon
    ),
  ];

  return {
    baseMonthlyRevenue: Math.round(base),
    derivedExpenseRatio: Math.round(expenseRatio * 100),
    assumptions: { ...a, horizonMonths: horizon },
    scenarios,
  };
}
