import { NextResponse } from "next/server";
import { isAlignmentArchitect, isSuperAdmin, resolveActor, sessionUser, viewedMember } from "@/lib/authz";
import { assessmentGateLocked } from "@/lib/assessmentGate";
import { USER_GUIDE_OPEN_TO_ALL, userGuideOpenFor } from "@/lib/userGuide/flag";
import { cleanExtras, cleanFeatureMap } from "@/lib/teamRoles";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

// Whether this account has a team (an invited member, or someone added to its Team Huddle by email). The menu shows
// Team Huddle only when it does (Babs, 2026-10-18): a solo founder has no one to huddle with.
async function accountHasTeam(): Promise<boolean> {
  const planId = await resolveMasterPlanId();
  if (!planId) return false;
  const db = createServerClient();
  const { data: spaces } = await db.from("workspaces").select("id").eq("master_plan_id", planId);
  const ids = (spaces ?? []).map((w) => w.id as string);
  if (ids.length) {
    const { count } = await db.from("workspace_members").select("id", { count: "exact", head: true }).in("workspace_id", ids).in("status", ["active", "pending"]);
    if ((count ?? 0) > 0) return true;
  }
  const { count: shared } = await db.from("team_huddle_access").select("email", { count: "exact", head: true }).eq("master_plan_id", planId);
  return (shared ?? 0) > 0;
}


export const dynamic = "force-dynamic";

// Lightweight identity/role probe for the client UI (e.g. whether to show the
// coach-override control). The authoritative gate is server-side on the
// privileged routes themselves.
export async function GET() {
  // The owner has "View as team member" open: answer exactly as that member would be answered.
  const vm = await viewedMember();
  if (vm) {
    return NextResponse.json(
      {
        superAdmin: false,
        architect: false,
        assessmentsLocked: false,
        userGuide: USER_GUIDE_OPEN_TO_ALL,
        hasTeam: true,
        teamRole: vm.role,
        features: cleanFeatureMap((vm.permissions as { features?: unknown } | null)?.features),
        extras: cleanExtras((vm.permissions as { extras?: unknown } | null)?.extras),
        viewingMember: { id: vm.id, name: vm.name, role: vm.role },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  const [superAdmin, architect, actor] = await Promise.all([isSuperAdmin(), isAlignmentArchitect(), resolveActor()]);
  const signedIn = await sessionUser();
  // Client accounts that have not finished all three assessments see only setup, assessments, settings and support.
  let assessmentsLocked = false;
  if (!superAdmin && !architect && actor.kind !== "member") {
    if (signedIn?.id) assessmentsLocked = await assessmentGateLocked(signedIn.id, signedIn.email ?? null);
  }
  const hasTeam = architect || actor.kind === "member" ? true : await accountHasTeam().catch(() => true);
  return NextResponse.json(
    // teamRole is set only for an invited team member; owners and clients get null.
    // features: a member's per-feature access (null = their role's defaults), so the menu can hide what they can't open.
    {
      superAdmin,
      architect,
      assessmentsLocked,
      userGuide: userGuideOpenFor(signedIn?.email, architect),
      hasTeam,
      teamRole: actor.kind === "member" ? actor.role : null,
      features: actor.kind === "member" ? cleanFeatureMap((actor.permissions as unknown as { features?: unknown } | null)?.features) : null,
      // restrict / ownOnly / noDelete limits on a member (null = none), so the menu shows only their areas.
      extras: actor.kind === "member" ? cleanExtras((actor.permissions as unknown as { extras?: unknown } | null)?.extras) : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
