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
  // When the client uses the Pipeline board: value x each deal's own probability. The Expected
  // case then uses the deals' probabilities instead of the flat close % assumption.
  weightedPipelineValue?: number;
  pipelineDeals?: number;
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
  pipeline: { source: "pipeline" | "sales_activities"; openValue: number; weightedValue: number | null; deals: number | null; closePct: number };
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

  // With real deals, the expected close rate is the deals' own weighted probability; the other
  // scenarios scale it down/up. Otherwise, the client's flat close % assumption.
  const fromDeals = inputs.weightedPipelineValue !== undefined && inputs.openPipelineValue > 0;
  const expectedClose = fromDeals ? ((inputs.weightedPipelineValue ?? 0) / inputs.openPipelineValue) * 100 : a.pipelineClosePct;
  const lowClose = fromDeals ? expectedClose * 0.6 : Math.max(0, a.pipelineClosePct - CLOSE_DELTA);
  const highClose = fromDeals ? Math.min(100, expectedClose * 1.4) : Math.min(100, a.pipelineClosePct + CLOSE_DELTA);

  const scenarios: ScenarioProjection[] = [
    projectScenario(
      "conservative",
      "Conservative",
      base,
      a.monthlyGrowthPct - GROWTH_DELTA,
      lowClose,
      expenseRatio,
      inputs.openPipelineValue,
      horizon
    ),
    projectScenario(
      "expected",
      "Expected",
      base,
      a.monthlyGrowthPct,
      expectedClose,
      expenseRatio,
      inputs.openPipelineValue,
      horizon
    ),
    projectScenario(
      "optimistic",
      "Optimistic",
      base,
      a.monthlyGrowthPct + GROWTH_DELTA,
      highClose,
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
    pipeline: {
      source: inputs.weightedPipelineValue !== undefined ? "pipeline" : "sales_activities",
      openValue: Math.round(inputs.openPipelineValue),
      weightedValue: inputs.weightedPipelineValue !== undefined ? Math.round(inputs.weightedPipelineValue) : null,
      deals: inputs.pipelineDeals ?? null,
      closePct: Math.round(expectedClose),
    },
  };
}
