import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { dayInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

// The private page for a client or a contractor on one project. The unguessable link is the key.
//   client:     sees the project, its progress, milestones and the tasks marked "shared".
//   contractor: the same, and can move the tasks assigned to them.
const TZ = "America/Denver";

async function guestFor(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const db = createServerClient();
  const { data: g } = await db.from("project_guests").select("id, name, role, project_id, master_plan_id, revoked").eq("token", token).maybeSingle();
  if (!g || g.revoked) return null;
  return { db, g: g as { id: string; name: string; role: "client" | "contractor"; project_id: string; master_plan_id: string } };
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const ctx = await guestFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This link isn't active." }, { status: 404 });
  const { db, g } = ctx;
  const [{ data: p }, { data: tasks }, { data: milestones }, { data: plan }] = await Promise.all([
    db.from("projects").select("name, goal, status, start_date, due_date").eq("id", g.project_id).maybeSingle(),
    db.from("tasks").select("id, title, description, status, due_at, assignee_guest_id, shared").eq("project_id", g.project_id).eq("master_plan_id", g.master_plan_id).order("due_at", { ascending: true, nullsFirst: false }),
    db.from("project_milestones").select("title, due_date, done").eq("project_id", g.project_id).order("due_date", { ascending: true, nullsFirst: false }),
    db.from("client_master_plans").select("sender_name").eq("id", g.master_plan_id).maybeSingle(),
  ]);
  if (!p) return NextResponse.json({ error: "This link isn't active." }, { status: 404 });
  const all = (tasks ?? []) as { id: number; title: string; description: string | null; status: string; due_at: string | null; assignee_guest_id: string | null; shared: boolean }[];
  const visible = all.filter((t) => t.shared || t.assignee_guest_id === g.id);
  const done = all.filter((t) => t.status === "done").length;
  return NextResponse.json({
    guest: { name: g.name, role: g.role },
    from: (plan as { sender_name?: string } | null)?.sender_name || null,
    project: { name: p.name, goal: p.goal, status: p.status, startDate: p.start_date, dueDate: p.due_date, percent: all.length ? Math.round((done / all.length) * 100) : 0 },
    milestones: ((milestones ?? []) as { title: string; due_date: string | null; done: boolean }[]).map((m) => ({ title: m.title, dueDay: m.due_date, done: m.done })),
    tasks: visible.map((t) => ({ id: t.id, title: t.title, description: t.description ?? "", status: t.status, dueDay: t.due_at ? dayInTz(t.due_at, TZ) : null, mine: t.assignee_guest_id === g.id, canUpdate: g.role === "contractor" && t.assignee_guest_id === g.id })),
  });
}

// A contractor moves a task assigned to them: { taskId, status }.
export async function PATCH(request: Request, { params }: { params: { token: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await guestFor(params.token);
  if (!ctx) return NextResponse.json({ error: "This link isn't active." }, { status: 404 });
  const { db, g } = ctx;
  if (g.role !== "contractor") return NextResponse.json({ error: "This link is view-only." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  const status = ["backlog", "today", "in_progress", "waiting", "done"].includes(b.status) ? b.status : null;
  if (!status || !Number.isFinite(Number(b.taskId))) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const { data, error } = await db
    .from("tasks")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", Number(b.taskId))
    .eq("project_id", g.project_id)
    .eq("assignee_guest_id", g.id)
    .select("id")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "You can only update tasks assigned to you." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
