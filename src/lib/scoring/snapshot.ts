import { createServerClient } from "@/lib/supabase/server";

/**
 * Records a dated snapshot of the 12-dimension scores for a client. The first
 * snapshot for a plan is stored as the immutable 'baseline'; later ones are
 * 'recompute' (or 'checkin') points. This is what lets progress be measured as
 * movement over time rather than "latest vs latest".
 */

type Supa = ReturnType<typeof createServerClient>;

export async function captureSnapshot(
  supabase: Supa,
  masterPlanId: string,
  domains: Array<{ key: string; score: number | null }>,
  overall: number | null,
  type: "checkin" | "recompute" = "recompute"
): Promise<{ type: string } | null> {
  // Only snapshot when there's real data to record.
  const scored: Record<string, number> = {};
  for (const d of domains) {
    if (d.score !== null && Number.isFinite(d.score)) scored[d.key] = Math.round(d.score);
  }
  if (Object.keys(scored).length === 0) return null;

  const { data: existingBaseline } = await supabase
    .from("client_score_snapshots")
    .select("id")
    .eq("master_plan_id", masterPlanId)
    .eq("snapshot_type", "baseline")
    .maybeSingle();

  const snapshotType = existingBaseline ? type : "baseline";

  const { error } = await supabase.from("client_score_snapshots").insert({
    master_plan_id: masterPlanId,
    snapshot_type: snapshotType,
    overall: overall === null ? null : Math.round(overall),
    domains: scored,
  });
  if (error) {
    console.error("captureSnapshot:", error.message);
    return null;
  }
  return { type: snapshotType };
}
