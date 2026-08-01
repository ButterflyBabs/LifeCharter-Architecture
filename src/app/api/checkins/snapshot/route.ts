import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { getOrCreatePrimaryMasterPlan } from "@/lib/scoring/masterPlan";
import { gatherAndCompute } from "@/lib/scoring/gather";
import { captureSnapshot } from "@/lib/scoring/snapshot";

export const dynamic = "force-dynamic";

// Records a dated 'checkin' score point from the current computed scores —
// lightweight (no AI re-scoring). Called when a check-in completes so the
// trajectory accumulates points over time. First point becomes the baseline.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }

  const planId = await getOrCreatePrimaryMasterPlan();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();
  const computed = await gatherAndCompute();
  const snapshot = await captureSnapshot(supabase, planId, computed.domains, computed.overall, "checkin");

  return NextResponse.json(
    { ok: true, snapshot, overall: computed.overall },
    { headers: { "Cache-Control": "no-store" } }
  );
}
