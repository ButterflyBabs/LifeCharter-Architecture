import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { efGate, loadEfProject, shapeEfTask, EF_TASK_COLS, EF_PROJECT_STATUSES, clean, isDay } from "@/lib/ef/server";

export const dynamic = "force-dynamic";

// One Embraced;Fully project in the same shape as /api/projects/[id], so the Board, List and Timeline are the same
// components. Babs only; its own tables. There is no team, no guests and no sharing here, by design.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const g = await efGate();
  if ("error" in g) return g.error;
  await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const db = createServerClient();
  const p = await loadEfProject(db, g.planId, params.id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const [{ data: tasks }, { data: milestones }, { data: kids }, parent] = await Promise.all([
    db.from("ef_tasks").select(EF_TASK_COLS).eq("master_plan_id", g.planId).eq("project_id", params.id).order("board_position", { ascending: true }).order("created_at", { ascending: true }),
    db.from("ef_milestones").select("id, title, due_date, done, sort_order").eq("master_plan_id", g.planId).eq("project_id", params.id).order("due_date", { ascending: true, nullsFirst: false }),
    db.from("ef_projects").select("id, name, status").eq("master_plan_id", g.planId).eq("parent_id", params.id).order("sort_order").order("created_at"),
    p.parent_id ? db.from("ef_projects").select("id, name").eq("master_plan_id", g.planId).eq("id", p.parent_id as string).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return NextResponse.json({
    project: { id: p.id, name: p.name, goal: (p.goal as string | null) ?? "", status: p.status, startDate: p.start_date ?? null, dueDate: p.due_date ?? null, color: p.color ?? null, notes: (p.notes as string | null) ?? "", ownerMemberId: null, templateKey: null },
    tasks: ((tasks ?? []) as Record<string, unknown>[]).map(shapeEfTask),
    milestones: ((milestones ?? []) as { id: string; title: string; due_date: string | null; done: boolean }[]).map((m) => ({ id: m.id, title: m.title, dueDay: m.due_date, done: m.done })),
    guests: [],
    team: [],
    parent: parent.data ? { id: (parent.data as { id: string }).id, name: (parent.data as { name: string }).name } : null,
    children: ((kids ?? []) as { id: string; name: string; status: string }[]).map((k) => ({ id: k.id, name: k.name, status: k.status })),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  const db = createServerClient();
  const p = await loadEfProject(db, g.planId, params.id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.name === "string") {
    const n = clean(b.name, 160);
    if (!n) return NextResponse.json({ error: "A project needs a name." }, { status: 400 });
    u.name = n;
  }
  if (typeof b.goal === "string") u.goal = clean(b.goal, 2000) || null;
  if (typeof b.notes === "string") u.notes = b.notes.slice(0, 20000) || null;
  if (typeof b.status === "string") {
    if (!(EF_PROJECT_STATUSES as readonly string[]).includes(b.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    u.status = b.status;
  }
  for (const [k, col] of [["startDate", "start_date"], ["dueDate", "due_date"]] as const) {
    if (b[k] === null || b[k] === "") u[col] = null;
    else if (b[k] !== undefined) {
      if (!isDay(b[k])) return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
      u[col] = b[k];
    }
  }
  const { error } = await db.from("ef_projects").update(u).eq("id", params.id).eq("master_plan_id", g.planId);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE ?tasks=delete also removes the project's tasks; otherwise they stay as loose E:F tasks.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  const db = createServerClient();
  const p = await loadEfProject(db, g.planId, params.id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (new URL(request.url).searchParams.get("tasks") === "delete") await db.from("ef_tasks").delete().eq("master_plan_id", g.planId).eq("project_id", params.id);
  await db.from("ef_projects").delete().eq("id", params.id).eq("master_plan_id", g.planId);
  return NextResponse.json({ ok: true });
}
