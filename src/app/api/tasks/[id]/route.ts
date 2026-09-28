import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { dueFromBody } from "@/lib/taskDueInput";
import { planSegmentIds } from "@/lib/planScope";
import { planMembers, myMemberId, notifyAssignee, actorName } from "@/lib/taskAssignees";

export const dynamic = "force-dynamic";

// Update a task's status/priority (used by the Tasks board).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.status === "string") {
    update.status = body.status;
    update.completed_at = body.status === "done" ? new Date().toISOString() : null;
  }
  if (typeof body.priority === "string") update.priority = body.priority;
  const due = await dueFromBody(body);
  if (due === "invalid") return NextResponse.json({ error: "Enter a valid due date." }, { status: 400 });
  if (due) Object.assign(update, due);
  if (body.timeKind === "scheduled" || body.timeKind === "deadline") update.time_kind = body.timeKind;
  // Tag (or untag) the task to one of THIS client's segments.
  if (body.segmentId === null || body.segmentId === "") update.segment_id = null;
  else if (body.segmentId !== undefined) {
    const sid = Number(body.segmentId);
    const { data: seg } = (await planSegmentIds(masterPlanId)).includes(sid) ? await supabase.from("segments").select("id, business_id").eq("id", sid).maybeSingle() : { data: null };
    if (!seg) return NextResponse.json({ error: "Unknown segment." }, { status: 404 });
    update.segment_id = seg.id;
    update.business_id = seg.business_id;
  }

  // (Re)assign: a team member of this account, or "" / null for the owner.
  let newAssignee = null as Awaited<ReturnType<typeof planMembers>>[number] | null;
  if (body.assigneeId === null || body.assigneeId === "") update.assignee_member_id = null;
  else if (typeof body.assigneeId === "string") {
    newAssignee = (await planMembers(masterPlanId)).find((m) => m.id === body.assigneeId) ?? null;
    if (!newAssignee) return NextResponse.json({ error: "That person isn't on this account's team." }, { status: 400 });
    update.assignee_member_id = newAssignee.id;
  }
  const { data: before } = newAssignee ? await supabase.from("tasks").select("assignee_member_id").eq("id", params.id).eq("master_plan_id", masterPlanId).maybeSingle() : { data: null };

  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", params.id)
    .eq("master_plan_id", masterPlanId)
    .select("id, title, status, priority, due_at, due_has_time, time_kind, assignee_member_id")
    .maybeSingle();

  if (!error && !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (error) {
    console.error("PATCH /api/tasks/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (data && newAssignee && before?.assignee_member_id !== newAssignee.id && newAssignee.id !== (await myMemberId())) {
    await notifyAssignee(newAssignee, { title: data.title as string, due_at: data.due_at as string | null }, await actorName()).catch(() => {});
  }
  return NextResponse.json({ task: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { error } = await supabase.from("tasks").delete().eq("id", params.id).eq("master_plan_id", masterPlanId);
  if (error) {
    console.error("DELETE /api/tasks/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
