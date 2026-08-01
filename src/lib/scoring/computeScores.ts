/**
 * Scoring compute engine.
 *
 * Pure functions: given normalized assessment + operational inputs, produce the
 * twelve dimension scores with a per-source breakdown, freshness, and rationale
 * slots. The route layer gathers the inputs from the database and calls this;
 * keeping it pure makes it unit-testable and free of Next/Supabase concerns.
 */

import { DIMENSION_MODEL, DimensionKey, DimensionSource } from "./dimensionModel";
import {
  calculateRevenueHealthLike,
  calculateSystemsHealthLike,
  calculateSalesOpsLike,
} from "./operational";

// ---- Normalized inputs -----------------------------------------------------

export interface ProfitDomainScore {
  score: number; // 0-100
  answeredAt?: string | null;
}

export interface BrainAnswer {
  section: string;
  score: number | null; // 0-100 for scale questions; null for prose
  answeredAt?: string | null;
}

export interface PulseAnswer {
  label: string; // dimensionLabel, e.g. "Marketing Effectiveness"
  score: number; // 0-100
  answeredAt?: string | null;
}

export interface ScoringInputs {
  /** Per Profit-domain 0-100 (keys are Profit `domain` ids incl. "client"). */
  profitDomains: Record<string, ProfitDomainScore>;
  brain: BrainAnswer[];
  pulse: PulseAnswer[];
  /** Operational metrics (finance/systems/sales). Null when not yet entered. */
  operational: Record<string, number> | null;
  /** When the operational metrics were recorded (ISO), for freshness. */
  operationalAt?: string | null;
  /** 0-100 business-plan completeness, or null. */
  businessPlanCompleteness: number | null;
  /**
   * AI-derived 0-100 sub-scores for `method: "ai"` sources (Soul and Brain),
   * keyed by `${dimensionKey}:${sourceKind}` (e.g. "leadership:soul",
   * "leadership:brain") so Soul and Brain can each score the same dimension
   * without colliding. Absent keys contribute nothing and their weight
   * redistributes.
   */
  aiScores?: Record<string, { score: number; rationale?: string; answeredAt?: string }>;
  /** Reference "now" for staleness (ISO). Defaults to runtime now in the route. */
  now?: string;
}

// ---- Output ----------------------------------------------------------------

export interface SourceBreakdown {
  kind: DimensionSource["kind"];
  method: DimensionSource["method"];
  nominalWeight: number; // as authored in the model
  effectiveWeight: number; // after redistribution, 0-1
  subScore: number | null; // 0-100, or null when no data
  fresh: boolean;
  note?: string;
}

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  score: number | null; // 0-100, null when no source has data
  partial: boolean; // true when some weight was redistributed (AI/operational pending)
  lastMeasured: string | null;
  sources: SourceBreakdown[];
}

export interface ScoringOutput {
  domains: DimensionResult[];
  overall: number | null;
  hasData: boolean;
  partial: boolean; // any dimension partial
}

// ---- Helpers ---------------------------------------------------------------

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function isFresh(answeredAt: string | null | undefined, now: number, days: number): boolean {
  if (!answeredAt) return false;
  const t = new Date(answeredAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= days * 24 * 60 * 60 * 1000;
}

function latest(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter((d): d is string => !!d && !Number.isNaN(new Date(d).getTime()));
  if (!valid.length) return null;
  return valid.reduce((a, b) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b));
}

// Compute a single source's 0-100 sub-score from inputs (null = no data).
function subScoreFor(
  source: DimensionSource,
  key: DimensionKey,
  inputs: ScoringInputs
): { subScore: number | null; answeredAt: string | null } {
  // AI-scored sources (Soul prose, open Brain answers) read a cached sub-score
  // keyed by dimension + source kind.
  if (source.method === "ai") {
    const ai = inputs.aiScores?.[`${key}:${source.kind}`];
    return { subScore: ai ? ai.score : null, answeredAt: ai?.answeredAt ?? null };
  }
  switch (source.kind) {
    case "profit": {
      const d = source.profitDomain ? inputs.profitDomains[source.profitDomain] : undefined;
      return { subScore: d ? d.score : null, answeredAt: d?.answeredAt ?? null };
    }
    case "brain": {
      const secs = new Set(source.brainSections ?? []);
      const rows = inputs.brain.filter((b) => secs.has(b.section) && b.score !== null);
      const m = mean(rows.map((r) => r.score as number));
      return { subScore: m, answeredAt: latest(rows.map((r) => r.answeredAt)) };
    }
    case "pulse": {
      const labels = new Set(source.pulseLabels ?? []);
      const rows = inputs.pulse.filter((p) => labels.has(p.label));
      const vals = rows.map((r) => (source.invert ? 100 - r.score : r.score));
      const m = mean(vals);
      return { subScore: m, answeredAt: latest(rows.map((r) => r.answeredAt)) };
    }
    case "operational": {
      if (!inputs.operational) return { subScore: null, answeredAt: null };
      let s: number | null = null;
      if (key === "finance") s = calculateRevenueHealthLike(inputs.operational);
      else if (key === "systems") s = calculateSystemsHealthLike(inputs.operational);
      else if (key === "sales") s = calculateSalesOpsLike(inputs.operational);
      return { subScore: s, answeredAt: inputs.operationalAt ?? null };
    }
    case "business_plan": {
      return { subScore: inputs.businessPlanCompleteness, answeredAt: null };
    }
    default:
      // soul + any AI-scored source are handled above via method === "ai".
      return { subScore: null, answeredAt: null };
  }
}

// ---- Main ------------------------------------------------------------------

export function computeDimensionScores(inputs: ScoringInputs): ScoringOutput {
  const now = inputs.now ? new Date(inputs.now).getTime() : Date.now();

  const domains: DimensionResult[] = DIMENSION_MODEL.map((def) => {
    const raw = def.sources.map((source) => {
      const { subScore, answeredAt } = subScoreFor(source, def.key, inputs);
      const days = source.kind === "pulse" ? def.staleDays.pulse : def.staleDays.assessment;
      return {
        source,
        subScore,
        answeredAt,
        fresh: isFresh(answeredAt, now, days),
      };
    });

    const present = raw.filter((r) => r.subScore !== null);
    const totalPresentWeight = present.reduce((s, r) => s + r.source.weight, 0);
    const nominalTotal = def.sources.reduce((s, r) => s + r.weight, 0);

    const sources: SourceBreakdown[] = raw.map((r) => {
      const effective =
        r.subScore !== null && totalPresentWeight > 0 ? r.source.weight / totalPresentWeight : 0;
      let note: string | undefined;
      if (r.subScore === null) {
        note =
          r.source.method === "ai"
            ? "AI scoring pending"
            : r.source.kind === "operational"
              ? "no operational data yet"
              : "not answered yet";
      }
      return {
        kind: r.source.kind,
        method: r.source.method,
        nominalWeight: Math.round((r.source.weight / nominalTotal) * 100),
        effectiveWeight: Number(effective.toFixed(3)),
        subScore: r.subScore === null ? null : Math.round(r.subScore),
        fresh: r.fresh,
        note,
      };
    });

    const score =
      present.length && totalPresentWeight > 0
        ? Math.round(
            present.reduce((s, r) => s + (r.source.weight / totalPresentWeight) * (r.subScore as number), 0)
          )
        : null;

    // Partial if any nominal weight went unfilled (AI/operational/unanswered).
    const partial = present.length > 0 && totalPresentWeight < nominalTotal;

    return {
      key: def.key,
      label: def.label,
      score,
      partial,
      lastMeasured: latest(raw.map((r) => r.answeredAt)),
      sources,
    };
  });

  const scored = domains.filter((d) => d.score !== null);
  const overall = scored.length
    ? Math.round(scored.reduce((s, d) => s + (d.score as number), 0) / scored.length)
    : null;

  return {
    domains,
    overall,
    hasData: scored.length > 0,
    partial: domains.some((d) => d.partial),
  };
}
