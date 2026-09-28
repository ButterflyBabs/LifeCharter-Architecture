import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { dueFromBody } from "@/lib/taskDueInput";
import { planSegmentIds } from "@/lib/planScope";
import { planMembers, myMemberId, notifyAssignee, actorName } from "@/lib/taskAssignees";
import { logActivity, q, type ActivityInput } from "@/lib/activity";

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
  const { data: before } = await supabase.from("tasks").select("status, assignee_member_id").eq("id", params.id).eq("master_plan_id", masterPlanId).maybeSingle();

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
  if (data) {
    const t = q(data.title);
    const log: ActivityInput[] = [];
    const base = { masterPlanId, entityType: "task" as const, entityId: data.id as number };
    if (typeof body.status === "string" && body.status !== before?.status) {
      if (body.status === "done") log.push({ ...base, action: "completed", summary: `Completed task ${t}` });
      else if (before?.status === "done") log.push({ ...base, action: "reopened", summary: `Reopened task ${t}` });
      else log.push({ ...base, action: "updated", summary: `Moved task ${t} to ${body.status}` });
    }
    if ("assignee_member_id" in update && (before?.assignee_member_id ?? null) !== (update.assignee_member_id ?? null)) {
      log.push({ ...base, action: "reassigned", summary: `Reassigned task ${t} to ${newAssignee ? newAssignee.name : "the account owner"}` });
    }
    if (!log.length && Object.keys(update).some((k) => k !== "updated_at" && k !== "status" && k !== "completed_at" && k !== "assignee_member_id")) {
      log.push({ ...base, action: "updated", summary: `Updated task ${t}` });
    }
    if (log.length) await logActivity(log);
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
  const { data: gone, error } = await supabase.from("tasks").delete().eq("id", params.id).eq("master_plan_id", masterPlanId).select("id, title");
  if (error) {
    console.error("DELETE /api/tasks/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const row = gone?.[0];
  if (row) await logActivity({ masterPlanId, action: "deleted", entityType: "task", entityId: row.id as number, summary: `Deleted task ${q(row.title)}` });
  return NextResponse.json({ ok: true });
}
