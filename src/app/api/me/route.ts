import { NextResponse } from "next/server";
import { isAlignmentArchitect, isSuperAdmin, resolveActor, sessionUser } from "@/lib/authz";
import { assessmentGateLocked } from "@/lib/assessmentGate";
import { cleanFeatureMap } from "@/lib/teamRoles";


export const dynamic = "force-dynamic";

// Lightweight identity/role probe for the client UI (e.g. whether to show the
// coach-override control). The authoritative gate is server-side on the
// privileged routes themselves.
export async function GET() {
  const [superAdmin, architect, actor] = await Promise.all([isSuperAdmin(), isAlignmentArchitect(), resolveActor()]);
  // Client accounts that have not finished all three assessments see only setup, assessments, settings and support.
  let assessmentsLocked = false;
  if (!superAdmin && !architect && actor.kind !== "member") {
    const u = await sessionUser();
    if (u?.id) assessmentsLocked = await assessmentGateLocked(u.id, u.email ?? null);
  }
  return NextResponse.json(
    // teamRole is set only for an invited team member; owners and clients get null.
    // features: a member's per-feature access (null = their role's defaults), so the menu can hide what they can't open.
    {
      superAdmin,
      architect,
      assessmentsLocked,
      teamRole: actor.kind === "member" ? actor.role : null,
      features: actor.kind === "member" ? cleanFeatureMap((actor.permissions as unknown as { features?: unknown } | null)?.features) : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
