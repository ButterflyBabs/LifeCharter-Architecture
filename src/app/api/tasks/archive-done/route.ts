import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { currentBusiness } from "@/lib/businessScope";
import { myMemberId } from "@/lib/taskAssignees";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

// POST { assignee?: "me" | "none" | <member id> }: archive every DONE task in the person's current view (the
// business switcher and the assignee filter on the Tasks page). Archived tasks leave the board but stay in the
// table, so completion history and follow-through health are unchanged; they can be restored from Archived.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const who = typeof body.assignee === "string" ? body.assignee : "";

  let q = supabase
    .from("tasks")
    .update({ archived_at: new Date().toISOString() })
    .eq("master_plan_id", masterPlanId)
    .eq("status", "done")
    .is("archived_at", null);
  const scope = await currentBusiness(masterPlanId);
  if (scope) q = q.eq("business_id", scope.businessId);
  if (who === "me") {
    const me = await myMemberId();
    q = me ? q.eq("assignee_member_id", me) : q.is("assignee_member_id", null);
  } else if (who === "none") q = q.is("assignee_member_id", null);
  else if (/^[0-9a-f-]{36}$/i.test(who)) q = q.eq("assignee_member_id", who);

  const { data, error } = await q.select("id");
  if (error) {
    console.error("POST /api/tasks/archive-done:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const n = data?.length ?? 0;
  if (n) await logActivity({ masterPlanId, action: "updated", entityType: "task", summary: `Archived ${n} done task${n === 1 ? "" : "s"}` }).catch(() => {});
  return NextResponse.json({ ok: true, archived: n });
}
