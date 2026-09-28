import { NextResponse } from "next/server";
import { isAlignmentArchitect, isSuperAdmin, resolveActor } from "@/lib/authz";

export const dynamic = "force-dynamic";

// Lightweight identity/role probe for the client UI (e.g. whether to show the
// coach-override control). The authoritative gate is server-side on the
// privileged routes themselves.
export async function GET() {
  const [superAdmin, architect, actor] = await Promise.all([isSuperAdmin(), isAlignmentArchitect(), resolveActor()]);
  return NextResponse.json(
    // teamRole is set only for an invited team member; owners and clients get null.
    { superAdmin, architect, teamRole: actor.kind === "member" ? actor.role : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
