import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { buildForecast, loadAssumptions } from "@/lib/planning/forecastData";

export const dynamic = "force-dynamic";

// GET — the computed forecast (three scenarios) + current assumptions.
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "no workspace" }, { status: 400 });
  const forecast = await buildForecast(masterPlanId);
  return NextResponse.json({ forecast });
}

// POST — save assumptions, then return the recomputed forecast.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "no workspace" }, { status: 400 });
  const supabase = createServerClient();
  const body = await request.json().catch(() => ({}));

  const clampNum = (v: unknown, lo: number, hi: number, fallback: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(lo, Math.min(hi, n));
  };

  const current = await loadAssumptions(masterPlanId);
  const row = {
    master_plan_id: masterPlanId,
    horizon_months: Math.round(clampNum(body.horizonMonths, 1, 24, current.horizonMonths)),
    monthly_growth_pct: clampNum(body.monthlyGrowthPct, -50, 100, current.monthlyGrowthPct),
    pipeline_close_pct: clampNum(body.pipelineClosePct, 0, 100, current.pipelineClosePct),
    expense_ratio_pct: clampNum(body.expenseRatioPct, 0, 150, current.expenseRatioPct),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("forecast_assumptions")
    .select("id")
    .eq("master_plan_id", masterPlanId)
    .maybeSingle();
  if (existing?.id) {
    await supabase.from("forecast_assumptions").update(row).eq("id", existing.id);
  } else {
    await supabase.from("forecast_assumptions").insert(row);
  }

  const forecast = await buildForecast(masterPlanId);
  return NextResponse.json({ forecast, saved: true });
}
