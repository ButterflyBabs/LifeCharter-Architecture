import { NextResponse } from "next/server";
import { isAlignmentArchitect, isSuperAdmin, resolveActor } from "@/lib/authz";
import { cleanFeatureMap } from "@/lib/teamRoles";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Lightweight identity/role probe for the client UI (e.g. whether to show the
// coach-override control). The authoritative gate is server-side on the
// privileged routes themselves.
export async function GET() {
  const [superAdmin, architect, actor, planId] = await Promise.all([isSuperAdmin(), isAlignmentArchitect(), resolveActor(), resolveMasterPlanId()]);
  // This account's name for its DM Pipeline (the menu shows it).
  const { data: plan } = planId ? await createServerClient().from("client_master_plans").select("dm_pipeline_name").eq("id", planId).maybeSingle() : { data: null };
  return NextResponse.json(
    // teamRole is set only for an invited team member; owners and clients get null.
    // features: a member's per-feature access (null = their role's defaults), so the menu can hide what they can't open.
    {
      superAdmin,
      architect,
      teamRole: actor.kind === "member" ? actor.role : null,
      features: actor.kind === "member" ? cleanFeatureMap((actor.permissions as unknown as { features?: unknown } | null)?.features) : null,
      dmPipelineName: (plan?.dm_pipeline_name as string) || null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
