/**
 * Gathers normalized scoring inputs from the database (service-role) and runs
 * the compute engine. Defensive by design: any source that isn't persisted yet
 * simply returns empty, and its weight redistributes in the engine.
 *
 * Today the only source that can hold data is the Profit-derived domain_scores
 * on the client master plan. Brain/Soul persistence and operational entry are
 * still to come; when they land, this is the one place that wires them in.
 */

import { createServerClient } from "@/lib/supabase/server";
import { computeDimensionScores, ScoringInputs, ScoringOutput } from "./computeScores";
import { baselineCompleteness } from "@/lib/plans/blueprints";

// Profit domainNumber → Profit domain id (matches the assessment).
const NUM_TO_PROFIT: Record<number, string> = {
  1: "marketing",
  2: "sales",
  3: "operations",
  4: "finance",
  5: "team",
  6: "systems",
  7: "leadership",
  8: "vision",
  9: "product",
  10: "client",
  11: "legal",
  12: "sustainability",
};

type Supa = ReturnType<typeof createServerClient>;

async function latestMasterPlan(supabase: Supa, planId?: string | null) {
  // Always one specific client's plan. There is no "most recent plan" fallback —
  // that would show one client another client's scores.
  if (!planId) return null;
  const { data } = await supabase
    .from("client_master_plans")
    .select("id, domain_scores, metadata, last_assessment_at, updated_at")
    .eq("id", planId)
    .maybeSingle();
  return data as
    | {
        id: string;
        domain_scores: Record<string, { name?: string; score?: number }> | null;
        metadata: {
          ai_scores?: Record<string, { score: number; rationale?: string; answeredAt?: string }>;
          operational?: Record<string, number>;
          operational_at?: string;
        } | null;
        last_assessment_at: string | null;
        updated_at: string | null;
      }
    | null;
}

function aiScoresFromMasterPlan(
  mp: Awaited<ReturnType<typeof latestMasterPlan>>
): ScoringInputs["aiScores"] {
  const raw = mp?.metadata?.ai_scores;
  if (!raw) return undefined;
  // Keys are composite ("${dimension}:${kind}") — pass through as-is.
  const out: NonNullable<ScoringInputs["aiScores"]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v.score === "number") {
      out[k] = { score: v.score, rationale: v.rationale, answeredAt: v.answeredAt };
    }
  }
  return out;
}

function profitFromMasterPlan(mp: Awaited<ReturnType<typeof latestMasterPlan>>): ScoringInputs["profitDomains"] {
  const out: ScoringInputs["profitDomains"] = {};
  if (!mp?.domain_scores) return out;
  const answeredAt = mp.last_assessment_at ?? mp.updated_at ?? null;
  for (const [k, v] of Object.entries(mp.domain_scores)) {
    const num = Number(k.replace(/^domain_/, ""));
    const profitId = NUM_TO_PROFIT[num];
    if (profitId && v && typeof v.score === "number") {
      out[profitId] = { score: v.score, answeredAt };
    }
  }
  return out;
}

async function pulseAnswers(supabase: Supa, planId?: string | null): Promise<ScoringInputs["pulse"]> {
  // Best-effort: read the latest check-in's per-item responses if present.
  let q = supabase
    .from("quick_pulse_checkins")
    .select("responses, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  if (planId) q = q.eq("master_plan_id", planId);
  const { data } = await q.maybeSingle();
  const row = data as { responses: unknown; created_at: string } | null;
  if (!row?.responses) return [];
  const out: ScoringInputs["pulse"] = [];
  try {
    // responses is expected as an array of { label/dimensionLabel, score(1-5 or 0-100) }.
    const arr = Array.isArray(row.responses) ? row.responses : [];
    for (const r of arr as Array<Record<string, unknown>>) {
      const label = (r.dimensionLabel ?? r.label) as string | undefined;
      const rawScore = Number(r.score ?? r.value);
      if (!label || Number.isNaN(rawScore)) continue;
      // Normalize a 1-5 answer to 0-100; leave already-0-100 values alone.
      const score = rawScore <= 5 ? rawScore * 20 : rawScore;
      out.push({ label, score, answeredAt: row.created_at });
    }
  } catch {
    /* ignore malformed */
  }
  return out;
}

async function brainAnswers(supabase: Supa, planId?: string | null): Promise<ScoringInputs["brain"]> {
  let q = supabase
    .from("unified_client_responses")
    .select("section_name, score, max_score, answered_at")
    .eq("assessment_type", "brain");
  if (planId) q = q.eq("master_plan_id", planId);
  const { data } = await q;
  const rows = (data ?? []) as Array<{
    section_name: string | null;
    score: number | null;
    max_score: number | null;
    answered_at: string | null;
  }>;
  return rows
    .filter((r) => r.section_name)
    .map((r) => ({
      section: r.section_name as string,
      score:
        r.score === null
          ? null
          : Math.round((r.score / Math.max(r.max_score ?? 100, 1)) * 100),
      answeredAt: r.answered_at,
    }));
}


// Operational metrics derived LIVE from the app's own data (finance ledger,
// sales pipeline, operational pillars) — so the dimensions reflect the whole
// app, not just the monthly-review blob. Only keys with real data are set.
async function liveOperationalMetrics(
  supabase: ReturnType<typeof createServerClient>,
  scopeId: string | null
): Promise<Record<string, number>> {
  const m: Record<string, number> = {};
  if (!scopeId) return m;
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

  // Finance — this month's revenue & expenses from the ledger.
  try {
    const { data } = await supabase
      .from("finance_entries")
      .select("type, amount, occurred_on")
      .eq("master_plan_id", scopeId)
      .gte("occurred_on", monthStart);
    const rows = (data || []) as { type: string; amount: number | string | null }[];
    if (rows.length) {
      let income = 0;
      let expense = 0;
      for (const e of rows) {
        const a = Number(e.amount ?? 0);
        if (e.type === "income") income += a;
        else expense += a;
      }
      m.revenue = income;
      m.expenses = expense;
    }
  } catch {
    /* optional */
  }
  // Monthly income target from budgets → revenue_goal.
  try {
    const { data } = await supabase
      .from("finance_budgets")
      .select("amount")
      .eq("master_plan_id", scopeId)
      .eq("type", "income")
      .eq("category", "")
      .maybeSingle();
    if (data?.amount != null) m.revenue_goal = Number(data.amount);
  } catch {
    /* optional */
  }

  // Sales — conversion (won vs decided) + recent activity volume.
  try {
    const { data } = await supabase
      .from("sales_activities")
      .select("outcome, occurred_on")
      .eq("master_plan_id", scopeId);
    const rows = (data || []) as { outcome: string | null; occurred_on: string | null }[];
    if (rows.length) {
      const won = rows.filter((r) => r.outcome === "won").length;
      const lost = rows.filter((r) => r.outcome === "lost").length;
      if (won + lost > 0) m.conversion_rate = Math.round((won / (won + lost)) * 100);
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      m.leads = rows.filter((r) => (r.occurred_on || "") >= cutoff).length;
    }
  } catch {
    /* optional */
  }

  // Operations — how many of the 8 pillars are solid / in progress.
  try {
    const { data } = await supabase
      .from("operations_pillars")
      .select("status")
      .eq("master_plan_id", scopeId);
    const rows = (data || []) as { status: string | null }[];
    if (rows.length) {
      m.pillars_total = 8;
      m.pillars_complete = rows.filter((r) => r.status === "complete").length;
      m.pillars_inprogress = rows.filter((r) => r.status === "in_progress").length;
    }
  } catch {
    /* optional */
  }

  return m;
}

// Baseline completeness per plan type (business/marketing/sales/forecasting),
// so each plan feeds its matching dimension. Null = not started (neutral).
async function planCompletenessFor(
  supabase: ReturnType<typeof createServerClient>,
  scopeId: string | null
): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = { business: null, marketing: null, sales: null, forecasting: null };
  if (!scopeId) return out;
  try {
    const { data } = await supabase
      .from("plan_sections")
      .select("plan_type, section_key, content")
      .eq("master_plan_id", scopeId);
    const bySet: Record<string, Set<string>> = {};
    for (const r of (data || []) as { plan_type: string; section_key: string; content: string | null }[]) {
      if (!(r.content || "").trim()) continue;
      (bySet[r.plan_type] ||= new Set<string>()).add(r.section_key);
    }
    for (const t of ["business", "marketing", "sales", "forecasting"]) {
      out[t] = bySet[t] ? baselineCompleteness(t, bySet[t]) : null;
    }
  } catch {
    /* optional */
  }
  return out;
}

export async function gatherAndCompute(
  planId?: string | null
): Promise<ScoringOutput & { masterPlanId: string | null }> {
  const supabase = createServerClient();
  const mp = await latestMasterPlan(supabase, planId);
  const scopeId = mp?.id ?? planId ?? null;
  const [pulse, brain, planCompleteness, live] = await Promise.all([
    pulseAnswers(supabase, scopeId),
    brainAnswers(supabase, scopeId),
    planCompletenessFor(supabase, scopeId),
    liveOperationalMetrics(supabase, scopeId),
  ]);

  // Merge live metrics over the manual monthly-review blob (live wins where present).
  // Only what the app itself measures (ledger, sales, pillars). No screen writes the
  // old hand-entered "monthly review" blob any more, so a leftover one must not count.
  const hasLive = Object.keys(live).length > 0;
  const operational = hasLive ? live : null;

  const inputs: ScoringInputs = {
    profitDomains: profitFromMasterPlan(mp),
    brain,
    pulse,
    operational,
    operationalAt: hasLive ? new Date().toISOString() : null,
    businessPlanCompleteness: planCompleteness.business,
    planCompleteness,
    aiScores: aiScoresFromMasterPlan(mp), // Phase 2: cached by /api/scoring/recompute
    now: new Date().toISOString(),
  };

  // A cached AI score is only valid while the answers it was scored from still
  // exist. If a client's answers are gone (or they never gave any), their cached
  // scores must not keep producing a health score.
  if (inputs.aiScores) {
    const { data: rows } = await supabase
      .from("unified_client_responses")
      .select("assessment_type")
      .eq("master_plan_id", scopeId as string)
      .limit(2000);
    const have = new Set(((rows ?? []) as { assessment_type: string }[]).map((r) => r.assessment_type));
    const kept: NonNullable<ScoringInputs["aiScores"]> = {};
    for (const [k, v] of Object.entries(inputs.aiScores)) {
      const kind = k.split(":")[1];
      const source = kind === "profit" ? "profit_architecture" : kind;
      if (have.has(source)) kept[k] = v;
    }
    inputs.aiScores = kept;
  }

  const output = computeDimensionScores(inputs);
  return { ...output, masterPlanId: mp?.id ?? null };
}


// A health score means something only when several dimensions have real evidence
// behind them. One ticked operations pillar, say, must not read as "your overall
// business health is 12". Below this, callers treat the client as "not scored yet".
export const MIN_SCORED_DIMENSIONS = 3;
export const isMeaningful = (domains: Array<{ score: number | null }>) =>
  domains.filter((d) => d.score !== null).length >= MIN_SCORED_DIMENSIONS;
