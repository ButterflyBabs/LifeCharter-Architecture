import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { planMembers } from "@/lib/taskAssignees";
import { loadProject, shapeTask, TASK_COLS, PROJECT_STATUSES, clean, isDay } from "@/lib/projects/server";
import { logActivity, q } from "@/lib/activity";

export const dynamic = "force-dynamic";

// GET: one project with its tasks, milestones, team and the people it is shared with.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const p = await loadProject(db, planId, params.id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const [{ data: tasks }, { data: milestones }, { data: guests }, members] = await Promise.all([
    db.from("tasks").select(TASK_COLS).eq("master_plan_id", planId).eq("project_id", params.id).order("board_position", { ascending: true }).order("created_at", { ascending: true }),
    db.from("project_milestones").select("id, title, due_date, done, sort_order").eq("project_id", params.id).order("due_date", { ascending: true, nullsFirst: false }),
    db.from("project_guests").select("id, name, email, role, token, revoked, created_at").eq("project_id", params.id).order("created_at"),
    planMembers(planId),
  ]);
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
  return NextResponse.json({
    project: { id: p.id, name: p.name, goal: p.goal ?? "", status: p.status, startDate: p.start_date, dueDate: p.due_date, color: p.color, notes: p.notes ?? "", ownerMemberId: p.owner_member_id, templateKey: p.template_key },
    tasks: ((tasks ?? []) as Record<string, unknown>[]).map((t) => shapeTask(t, tz)),
    milestones: ((milestones ?? []) as { id: string; title: string; due_date: string | null; done: boolean }[]).map((m) => ({ id: m.id, title: m.title, dueDay: m.due_date, done: m.done })),
    guests: ((guests ?? []) as { id: string; name: string; email: string | null; role: string; token: string; revoked: boolean }[]).filter((g) => !g.revoked).map((g) => ({ id: g.id, name: g.name, email: g.email, role: g.role, link: `${app}/p/${g.token}` })),
    team: members.map((m) => ({ id: m.id, name: m.name, role: m.role })),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const p = await loadProject(db, planId, params.id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.name === "string") {
    const n = clean(b.name, 160);
    if (!n) return NextResponse.json({ error: "A project needs a name." }, { status: 400 });
    u.name = n;
  }
  if (typeof b.goal === "string") u.goal = clean(b.goal, 1500) || null;
  if (typeof b.notes === "string") u.notes = b.notes.slice(0, 20000) || null;
  if (typeof b.status === "string") {
    if (!(PROJECT_STATUSES as readonly string[]).includes(b.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    u.status = b.status;
  }
  for (const [k, col] of [["startDate", "start_date"], ["dueDate", "due_date"]] as const) {
    if (b[k] === null || b[k] === "") u[col] = null;
    else if (b[k] !== undefined) {
      if (!isDay(b[k])) return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
      u[col] = b[k];
    }
  }
  if ("ownerMemberId" in b) {
    if (!b.ownerMemberId) u.owner_member_id = null;
    else if ((await planMembers(planId)).some((m) => m.id === b.ownerMemberId)) u.owner_member_id = b.ownerMemberId;
    else return NextResponse.json({ error: "That person isn't on this account's team." }, { status: 400 });
  }
  const { error } = await db.from("projects").update(u).eq("id", params.id).eq("master_plan_id", planId);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  if (u.status && u.status !== p.status) await logActivity({ masterPlanId: planId, action: "updated", entityType: "project", summary: `Marked project ${q(String(u.name ?? p.name))} ${String(u.status).replace("_", " ")}` });
  return NextResponse.json({ ok: true });
}

// DELETE ?tasks=delete also removes the project's tasks; otherwise they stay as ordinary tasks.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const p = await loadProject(db, planId, params.id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (new URL(request.url).searchParams.get("tasks") === "delete") await db.from("tasks").delete().eq("master_plan_id", planId).eq("project_id", params.id);
  await db.from("projects").delete().eq("id", params.id).eq("master_plan_id", planId);
  await logActivity({ masterPlanId: planId, action: "deleted", entityType: "project", summary: `Deleted project ${q(String(p.name))}` });
  return NextResponse.json({ ok: true });
}
