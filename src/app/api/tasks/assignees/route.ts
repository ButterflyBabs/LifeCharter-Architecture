import { NextResponse } from "next/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planMembers, myMemberId, ownTasksMemberId } from "@/lib/taskAssignees";

export const dynamic = "force-dynamic";

// Who tasks can be assigned to in this account, and who's asking.
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ members: [], me: null });
  const [members, me, salesId] = await Promise.all([planMembers(masterPlanId), myMemberId(), ownTasksMemberId()]);
  // A Sales member sees only themselves in the list (they cannot hand tasks to others).
  const visible = salesId ? members.filter((m) => m.id === salesId) : members;
  return NextResponse.json({ members: visible.map(({ id, name, role }) => ({ id, name, role })), me, sales: Boolean(salesId) });
}
