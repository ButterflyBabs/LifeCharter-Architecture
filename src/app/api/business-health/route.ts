import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { currentBusiness } from "@/lib/businessScope";
import { computeBusinessScores } from "@/lib/scoring/segmentScore";
import { DIMENSION_LABEL, type DimensionKey } from "@/lib/scoring/dimensionModel";

export const dynamic = "force-dynamic";

// Health per business (2026-10-11): each business's score starts from the account's assessment scores and moves
// with what is tied to THAT business: its tasks (finished lifts, slipped due dates lower) and its own compliance
// checklist. The header business switcher picks which one is shown; "All businesses" lists them all.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ selected: null, businesses: [] });
  const [biz, results] = await Promise.all([currentBusiness(planId), computeBusinessScores(planId).catch(() => [])]);
  const businesses = results.map((r) => ({
    id: r.businessId,
    name: r.name,
    overall: r.overall,
    coverage: r.coverage,
    scoredOnActivity: r.scoredOnActivity,
    needs: r.needs,
    progress: r.progress,
    dims: Object.entries(r.dims)
      .filter(([, d]) => d.score !== null)
      .map(([k, d]) => ({ key: k, label: DIMENSION_LABEL[k as DimensionKey] ?? k, score: d.score as number, source: d.source, tasks: d.evidence.tasks, needs: d.needs, wins: d.wins })),
  }));
  return NextResponse.json({ selected: biz ? { id: biz.businessId, name: biz.name } : null, businesses }, { headers: { "Cache-Control": "no-store" } });
}
