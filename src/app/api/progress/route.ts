import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getOrCreatePrimaryMasterPlan } from "@/lib/scoring/masterPlan";
import { gatherAndCompute } from "@/lib/scoring/gather";
import { captureSnapshot } from "@/lib/scoring/snapshot";
import { DIMENSION_LABEL } from "@/lib/scoring/dimensionModel";

export const dynamic = "force-dynamic";

// Progress = movement, on two axes:
//  1. Score delta vs the baseline snapshot, per dimension and overall.
//  2. Execution vs the active plans — how their goals are tracking.
// If no baseline exists yet, one is seeded from the current scores so the
// trajectory has a fixed anchor going forward.

type GoalStatus = "not_started" | "in_progress" | "met" | "slipped";
const STATUSES: GoalStatus[] = ["not_started", "in_progress", "met", "slipped"];

export async function GET() {
  const planId = await getOrCreatePrimaryMasterPlan();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();

  // Current (live) scores.
  const computed = await gatherAndCompute();
  const latestDomains: Record<string, number> = {};
  for (const d of computed.domains) {
    if (d.score !== null && Number.isFinite(d.score)) latestDomains[d.key] = Math.round(d.score);
  }

  // Baseline snapshot — seed from current scores if it doesn't exist yet.
  let { data: baseline } = await supabase
    .from("client_score_snapshots")
    .select("domains, overall, created_at")
    .eq("master_plan_id", planId)
    .eq("snapshot_type", "baseline")
    .maybeSingle();

  if (!baseline && Object.keys(latestDomains).length > 0) {
    await captureSnapshot(supabase, planId, computed.domains, computed.overall);
    const { data: seeded } = await supabase
      .from("client_score_snapshots")
      .select("domains, overall, created_at")
      .eq("master_plan_id", planId)
      .eq("snapshot_type", "baseline")
      .maybeSingle();
    baseline = seeded ?? null;
  }

  const baseDomains = (baseline?.domains ?? {}) as Record<string, number>;
  const hasBaseline = Boolean(baseline);

  // Per-dimension change since baseline (only dimensions with a current score).
  const dimensions = computed.domains
    .filter((d) => d.score !== null)
    .map((d) => {
      const latest = latestDomains[d.key];
      const base = typeof baseDomains[d.key] === "number" ? baseDomains[d.key] : null;
      return {
        key: d.key,
        label: (DIMENSION_LABEL as Record<string, string>)[d.key] ?? d.key,
        baseline: base,
        latest,
        delta: base === null ? null : latest - base,
      };
    });

  const overallLatest = computed.overall;
  const overallBase = typeof baseline?.overall === "number" ? baseline.overall : null;

  // Execution axis: active plans and their goal status.
  const { data: plans } = await supabase
    .from("client_plans")
    .select("id, plan_type, title, version")
    .eq("master_plan_id", planId)
    .eq("status", "active");

  const planList = (plans ?? []) as Array<{ id: string; plan_type: string; title: string | null; version: number }>;
  const planIds = planList.map((p) => p.id);

  const goalsByPlan = new Map<string, Record<GoalStatus, number>>();
  const totals: Record<GoalStatus, number> = { not_started: 0, in_progress: 0, met: 0, slipped: 0 };
  let totalGoals = 0;

  if (planIds.length > 0) {
    const { data: goals } = await supabase
      .from("client_plan_goals")
      .select("plan_id, status")
      .in("plan_id", planIds);
    for (const g of (goals ?? []) as Array<{ plan_id: string; status: GoalStatus }>) {
      const st = STATUSES.includes(g.status) ? g.status : "not_started";
      const bucket = goalsByPlan.get(g.plan_id) ?? { not_started: 0, in_progress: 0, met: 0, slipped: 0 };
      bucket[st] += 1;
      goalsByPlan.set(g.plan_id, bucket);
      totals[st] += 1;
      totalGoals += 1;
    }
  }

  const execution = {
    totals: { total: totalGoals, ...totals },
    plans: planList.map((p) => ({
      type: p.plan_type,
      title: p.title,
      version: p.version,
      goals: {
        total: Object.values(goalsByPlan.get(p.id) ?? {}).reduce((a, b) => a + b, 0),
        ...(goalsByPlan.get(p.id) ?? { not_started: 0, in_progress: 0, met: 0, slipped: 0 }),
      },
    })),
  };

  return NextResponse.json(
    {
      hasBaseline,
      baselineAt: baseline?.created_at ?? null,
      overall: { baseline: overallBase, latest: overallLatest, delta: overallBase === null || overallLatest === null ? null : overallLatest - overallBase },
      dimensions,
      execution,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
