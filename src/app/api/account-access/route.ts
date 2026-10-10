import { NextResponse } from "next/server";
import { resolveActor } from "@/lib/authz";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The account owner's own list of times LifeCharter support opened their account read-only
// (View as client). Dates only: the internal reason stays private. A team member does not see it.
export async function GET() {
  const actor = await resolveActor();
  if (actor.kind === "member" || actor.kind === "none") return NextResponse.json({ views: [] });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ views: [] });
  const supabase = createServerClient();
  const { data } = await supabase
    .from("client_view_log")
    .select("id, started_at, ended_at")
    .eq("master_plan_id", planId)
    .order("started_at", { ascending: false })
    .limit(20);
  return NextResponse.json({ views: data || [] }, { headers: { "Cache-Control": "no-store" } });
}
