import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { loadProject, insertProjectTasks, taskPatch, TASK_COLS, shapeTask, type NewTask } from "@/lib/projects/server";
import { planMembers, myMemberId, notifyAssignee, actorName } from "@/lib/taskAssignees";
import { logActivity, q } from "@/lib/activity";

export const dynamic = "force-dynamic";

// Add a task to this project: { title, status?, priority?, startDay?, dueDay?, description?, assigneeMemberId?, shared? }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  if (!(await loadProject(db, planId, params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const tz = await resolveUserTimeZone(typeof b.tz === "string" ? b.tz : null);
  if (typeof b.title !== "string" || !b.title.trim()) return NextResponse.json({ error: "A task needs a title." }, { status: 400 });
  const ids = await insertProjectTasks(db, planId, params.id, [b as NewTask], tz).catch(() => []);
  if (!ids.length) return NextResponse.json({ error: "Couldn't add the task." }, { status: 500 });
  // Optional assignee (a team member of this account).
  if (typeof b.assigneeMemberId === "string" && b.assigneeMemberId) {
    const patch = await taskPatch(planId, { assigneeMemberId: b.assigneeMemberId }, tz);
    if (!patch.error) {
      await db.from("tasks").update(patch.update).eq("id", ids[0]).eq("master_plan_id", planId);
      const m = (await planMembers(planId)).find((x) => x.id === b.assigneeMemberId);
      if (m && m.id !== (await myMemberId())) await notifyAssignee(m, { title: String(b.title) }, await actorName()).catch(() => {});
    }
  }
  const { data } = await db.from("tasks").select(TASK_COLS).eq("id", ids[0]).maybeSingle();
  await logActivity({ masterPlanId: planId, action: "created", entityType: "task", entityId: ids[0], summary: `Added task ${q(b.title)} to a project` });
  return NextResponse.json({ task: data ? shapeTask(data as Record<string, unknown>, tz) : null });
}
