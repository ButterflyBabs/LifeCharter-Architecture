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
import { DimensionKey } from "./dimensionModel";

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

async function latestMasterPlan(supabase: Supa) {
  const { data } = await supabase
    .from("client_master_plans")
    .select("id, domain_scores, metadata, last_assessment_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as
    | {
        id: string;
        domain_scores: Record<string, { name?: string; score?: number }> | null;
        metadata: { ai_scores?: Record<string, { score: number; rationale?: string; answeredAt?: string }> } | null;
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
  const out: NonNullable<ScoringInputs["aiScores"]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v.score === "number") {
      out[k as DimensionKey] = { score: v.score, rationale: v.rationale, answeredAt: v.answeredAt };
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

async function pulseAnswers(supabase: Supa): Promise<ScoringInputs["pulse"]> {
  // Best-effort: read the latest check-in's per-item responses if present.
  const { data } = await supabase
    .from("quick_pulse_checkins")
    .select("responses, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
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

async function brainAnswers(supabase: Supa): Promise<ScoringInputs["brain"]> {
  const { data } = await supabase
    .from("unified_client_responses")
    .select("section_name, score, max_score, answered_at")
    .eq("assessment_type", "brain");
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

export async function gatherAndCompute(): Promise<ScoringOutput & { masterPlanId: string | null }> {
  const supabase = createServerClient();
  const mp = await latestMasterPlan(supabase);
  const [pulse, brain] = await Promise.all([pulseAnswers(supabase), brainAnswers(supabase)]);

  const inputs: ScoringInputs = {
    profitDomains: profitFromMasterPlan(mp),
    brain,
    pulse,
    operational: null, // wired when monthly-review entry lands
    operationalAt: null,
    businessPlanCompleteness: null,
    aiScores: aiScoresFromMasterPlan(mp), // Phase 2: cached by /api/scoring/recompute
    now: new Date().toISOString(),
  };

  const output = computeDimensionScores(inputs);
  return { ...output, masterPlanId: mp?.id ?? null };
}
