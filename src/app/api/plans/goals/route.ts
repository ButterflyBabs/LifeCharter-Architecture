import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planSegmentIds } from "@/lib/planScope";
import { logActivity, q } from "@/lib/activity";

export const dynamic = "force-dynamic";

// Update a plan goal's status. This is the client marking their own progress
// (not a coach override), so it isn't super-admin gated — but the goal must
// belong to this client's master plan. Feeds the progress execution axis.

const STATUSES = ["not_started", "in_progress", "met", "slipped"] as const;
type GoalStatus = (typeof STATUSES)[number];

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const goalId = body?.goalId as string | undefined;
  const status = body?.status as GoalStatus | undefined;
  const settingSegment = body && Object.prototype.hasOwnProperty.call(body, "segmentId");
  if (!goalId || (!settingSegment && (!status || !STATUSES.includes(status)))) {
    return NextResponse.json({ error: "goalId and a valid status (or a segmentId) are required" }, { status: 400 });
  }

  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();

  // Confirm the goal belongs to a plan under this client's master plan.
  const { data: goal } = await supabase
    .from("client_plan_goals")
    .select("id, plan_id")
    .eq("id", goalId)
    .maybeSingle();
  if (!goal) return NextResponse.json({ error: "goal not found" }, { status: 404 });
  const { data: parent } = await supabase
    .from("client_plans")
    .select("master_plan_id")
    .eq("id", (goal as { plan_id: string }).plan_id)
    .maybeSingle();
  if (!parent || (parent as { master_plan_id: string }).master_plan_id !== planId) {
    return NextResponse.json({ error: "goal not found" }, { status: 404 });
  }

  // Assign the goal to one of this client's segments (or clear it).
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) patch.status = status;
  if (settingSegment) {
    if (body.segmentId === null || body.segmentId === "") patch.segment_id = null;
    else {
      const sid = Number(body.segmentId);
      if (!(await planSegmentIds(planId)).includes(sid)) return NextResponse.json({ error: "Unknown segment." }, { status: 404 });
      patch.segment_id = sid;
    }
  }

  const { data: updated, error } = await supabase
    .from("client_plan_goals")
    .update(patch)
    .eq("id", goalId)
    .select("id, dimension_key, title, detail, target, status, sort_order, segment_id")
    .single();

  if (error || !updated) {
    console.error("goal status update:", error?.message);
    return NextResponse.json({ error: "failed to update goal" }, { status: 500 });
  }

  if (status) {
    const t = q((updated as { title?: string }).title);
    const label: Record<GoalStatus, string> = { met: `Marked goal ${t} met`, in_progress: `Marked goal ${t} in progress`, slipped: `Marked goal ${t} slipped`, not_started: `Marked goal ${t} not started` };
    await logActivity({ masterPlanId: planId, action: status === "met" ? "completed" : "updated", entityType: "goal", entityId: goalId, summary: label[status] });
  }
  return NextResponse.json({ ok: true, goal: updated }, { headers: { "Cache-Control": "no-store" } });
}
