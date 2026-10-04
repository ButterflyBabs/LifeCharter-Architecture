/**
 * Operational sub-scores — the "hard data" half of the model. These mirror the
 * existing business-plan health math (src/lib/business-plan/healthCalculations.ts)
 * but take a loose metric bag so the compute engine can pass whatever is present.
 * Each returns a 0-100 or null when the required metrics are missing.
 */

type Metrics = Record<string, number>;

function has(m: Metrics, ...keys: string[]): boolean {
  return keys.every((k) => typeof m[k] === "number" && !Number.isNaN(m[k]));
}

/** Finance: revenue vs goal, margin, cash runway. */
export function calculateRevenueHealthLike(m: Metrics): number | null {
  if (!has(m, "revenue", "revenue_goal", "expenses")) return null;
  const revenueAchievement = Math.min((m.revenue / Math.max(m.revenue_goal, 1)) * 100, 150);
  const revenueScore = Math.min(revenueAchievement, 100);

  const profit = m.revenue - m.expenses;
  const margin = m.revenue > 0 ? (profit / m.revenue) * 100 : 0;
  const marginScore = Math.min((margin / 40) * 100, 100);

  const monthlyExpenses = Math.max(m.expenses, 1000);
  const cash = typeof m.cash_in_bank === "number" ? m.cash_in_bank : 0;
  const runwayMonths = cash / monthlyExpenses;
  const runwayScore = Math.min((runwayMonths / 12) * 100, 100);

  const growthScore = revenueScore >= 80 ? 100 : revenueScore;

  const health = revenueScore * 0.4 + marginScore * 0.3 + runwayScore * 0.2 + growthScore * 0.1;
  return Math.round(Math.max(0, Math.min(100, health)));
}

/** Systems: delegation, hours efficiency, documentation, delegation activity. */
export function calculateSystemsHealthLike(m: Metrics): number | null {
  // Without hours data, documented processes alone: SOP coverage of the 8
  // operational areas, from 50 (one area) up to 100 (all eight), so writing a
  // first SOP never lowers the score.
  if (!has(m, "hours_worked", "target_hours")) {
    if (!has(m, "sop_areas_covered") || m.sop_areas_covered <= 0) return null;
    return Math.round(50 + 50 * Math.min(m.sop_areas_covered / 8, 1));
  }
  const delegationRatio =
    m.target_hours > 0 ? Math.max(0, (1 - m.hours_worked / m.target_hours) * 100) : 0;
  const delegationScore = Math.max(0, 100 - delegationRatio);

  const hoursEfficiency =
    m.target_hours > 0
      ? Math.min((m.target_hours / Math.max(m.hours_worked, 1)) * 100, 100)
      : 50;

  const sops = typeof m.sops_created === "number" ? m.sops_created : 0;
  const sopScore = Math.min((sops / 20) * 100, 100);

  const delegated = typeof m.delegated_tasks === "number" ? m.delegated_tasks : 0;
  const taskScore = Math.min((delegated / 20) * 100, 100);

  const health = delegationScore * 0.35 + hoursEfficiency * 0.25 + sopScore * 0.25 + taskScore * 0.15;
  return Math.round(Math.max(0, Math.min(100, health)));
}

/** Operations: the average of the 8 operational pillar scores (each scored from assessments, check-ins, live data and the pillar's own questions). */
export function calculateOperationsHealthLike(m: Metrics): number | null {
  if (!has(m, "pillar_score_avg")) return null;
  return Math.round(Math.max(0, Math.min(100, m.pillar_score_avg)));
}

/** Sales: lead volume and conversion rate, lightly. */
export function calculateSalesOpsLike(m: Metrics): number | null {
  if (!has(m, "conversion_rate") && !has(m, "leads")) return null;
  // Conversion rate as a 0-100 (target 25% conversion = 100).
  const conv = has(m, "conversion_rate") ? Math.min((m.conversion_rate / 25) * 100, 100) : null;
  // Lead volume against a soft target of 40/mo.
  const leads = has(m, "leads") ? Math.min((m.leads / 40) * 100, 100) : null;
  const parts = [conv, leads].filter((x): x is number => x !== null);
  if (!parts.length) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/** Legal: share of the Legal & Compliance checklist done (in progress counts half). */
export function calculateLegalChecklistLike(m: Metrics): number | null {
  return has(m, "legal_checklist_pct") ? Math.round(Math.max(0, Math.min(100, m.legal_checklist_pct))) : null;
}

// ---- Operational pillar formulas (each 0-100, or null when the account has no data for it) --------------

const avg = (xs: Array<number | null>): number | null => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};
const cap = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Documented process for one pillar: one active SOP is a start, two or more is covered. */
export function sopCoverage(m: Metrics, pillarKey: string): number | null {
  const n = m[`sop_${pillarKey}`];
  return typeof n === "number" && n > 0 ? (n >= 2 ? 100 : 70) : null;
}

export function acquisitionOps(m: Metrics): number | null {
  return avg([
    has(m, "leads") ? cap((m.leads / 40) * 100) : null,
    has(m, "new_contacts_30d") ? cap((m.new_contacts_30d / 40) * 100) : null,
  ]);
}

export function salesJourneyOps(m: Metrics): number | null {
  return avg([
    has(m, "conversion_rate") ? cap((m.conversion_rate / 25) * 100) : null,
    has(m, "deals_open", "deals_next_step_pct") && m.deals_open > 0 ? cap(m.deals_next_step_pct) : null,
  ]);
}

export function communicationOps(m: Metrics): number | null {
  return avg([has(m, "sequences_active") ? cap(40 + m.sequences_active * 20) : null, sopCoverage(m, "communication")]);
}

export function cultureOps(m: Metrics): number | null {
  return avg([
    has(m, "sops_created") ? cap((m.sops_created / 10) * 100) : null,
    has(m, "reviews_90d") ? cap((m.reviews_90d / 3) * 100) : null,
    has(m, "recurring_tasks") ? cap((m.recurring_tasks / 3) * 100) : null,
  ]);
}

export function referralOps(m: Metrics): number | null {
  return avg([
    has(m, "affiliates_total") ? (m.affiliates_total >= 3 ? 100 : 70) : null,
    has(m, "referred_contacts") ? (m.referred_contacts >= 5 ? 100 : 80) : null,
    has(m, "testimonials_total") ? cap((m.testimonials_total / 5) * 100) : null,
    sopCoverage(m, "referral"),
  ]);
}
