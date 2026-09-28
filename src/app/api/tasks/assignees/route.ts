import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planMembers, myMemberId } from "@/lib/taskAssignees";

export const dynamic = "force-dynamic";

// Who tasks can be assigned to in this account, and who's asking.
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ members: [], me: null });
  const [members, me] = await Promise.all([planMembers(masterPlanId), myMemberId()]);
  return NextResponse.json({ members: members.map(({ id, name, role }) => ({ id, name, role })), me });
}
