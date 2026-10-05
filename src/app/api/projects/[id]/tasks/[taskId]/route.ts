import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { loadProject, taskPatch, TASK_COLS, shapeTask } from "@/lib/projects/server";
import { planMembers, myMemberId, notifyAssignee, actorName } from "@/lib/taskAssignees";
import { logActivity, q } from "@/lib/activity";

export const dynamic = "force-dynamic";

// Edit a card: title, description, status (drag between columns), priority, dates, assignee, shared with guests.
export async function PATCH(request: Request, { params }: { params: { id: string; taskId: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  if (!(await loadProject(db, planId, params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const tz = await resolveUserTimeZone(typeof b.tz === "string" ? b.tz : null);
  const { update, error, newMember } = await taskPatch(planId, b, tz);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if ("assigneeGuestId" in b && typeof b.assigneeGuestId === "string" && b.assigneeGuestId) {
    const { data: g } = await db.from("project_guests").select("id").eq("id", b.assigneeGuestId).eq("project_id", params.id).eq("revoked", false).maybeSingle();
    if (!g) return NextResponse.json({ error: "That person isn't on this project." }, { status: 400 });
  }
  const { data: before } = await db.from("tasks").select("status, assignee_member_id").eq("id", params.taskId).eq("master_plan_id", planId).eq("project_id", params.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data, error: e2 } = await db.from("tasks").update(update).eq("id", params.taskId).eq("master_plan_id", planId).eq("project_id", params.id).select(TASK_COLS).maybeSingle();
  if (e2 || !data) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  if (newMember && before.assignee_member_id !== newMember && newMember !== (await myMemberId())) {
    const m = (await planMembers(planId)).find((x) => x.id === newMember);
    if (m) await notifyAssignee(m, { title: String((data as Record<string, unknown>).title) }, await actorName()).catch(() => {});
  }
  if (typeof b.status === "string" && b.status !== before.status) {
    await logActivity({ masterPlanId: planId, action: b.status === "done" ? "completed" : "updated", entityType: "task", entityId: Number(params.taskId), summary: b.status === "done" ? `Completed task ${q((data as Record<string, unknown>).title)}` : `Moved task ${q((data as Record<string, unknown>).title)} to ${b.status}` });
  }
  return NextResponse.json({ task: shapeTask(data as Record<string, unknown>, tz) });
}

export async function DELETE(request: Request, { params }: { params: { id: string; taskId: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data } = await db.from("tasks").delete().eq("id", params.taskId).eq("master_plan_id", planId).eq("project_id", params.id).select("title").maybeSingle();
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({ masterPlanId: planId, action: "deleted", entityType: "task", entityId: Number(params.taskId), summary: `Deleted task ${q((data as Record<string, unknown>).title)}` });
  return NextResponse.json({ ok: true });
}
