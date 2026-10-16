import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/planScope";

export const dynamic = "force-dynamic";

// Embraced;Fully task list: Alignment Architect (Babs) only. Its own table, never mixed with the Tasks page.
//   GET                 → { tasks }
//   POST   { title, priority?, dueDate?, notes?, todayOn? }
//   PATCH  { id, title?, notes?, status?, priority?, dueDate? (YYYY-MM-DD or null), todayOn? }
//   DELETE { id }
async function gate() {
  if (!(await isAlignmentArchitect())) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) } as const;
  const planId = await housePlanId();
  if (!planId) return { error: NextResponse.json({ error: "No house account found." }, { status: 500 }) } as const;
  return { planId } as const;
}

const STATUSES = ["today", "in_progress", "waiting", "backlog", "done"];
const PRIORITIES = ["critical", "high", "medium", "low"];
const SELECT = "id, title, notes, status, priority, due_date, today_on, completed_at, created_at";
const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET() {
  const g = await gate();
  if ("error" in g) return g.error;
  const { data } = await createServerClient().from("ef_tasks").select(SELECT).eq("master_plan_id", g.planId).order("created_at", { ascending: true }).limit(1000);
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 300) : "";
  if (!title) return NextResponse.json({ error: "What is the task?" }, { status: 400 });
  const { data, error } = await createServerClient()
    .from("ef_tasks")
    .insert({
      master_plan_id: g.planId,
      title,
      notes: typeof b.notes === "string" && b.notes.trim() ? b.notes.trim().slice(0, 20000) : null,
      status: "today",
      priority: PRIORITIES.includes(b.priority) ? b.priority : "medium",
      due_date: isDay(b.dueDate) ? b.dueDate : null,
      today_on: isDay(b.todayOn) ? b.todayOn : null,
    })
    .select(SELECT)
    .single();
  if (error) return NextResponse.json({ error: "Couldn't add it." }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  if (typeof b.id !== "string") return NextResponse.json({ error: "Missing task." }, { status: 400 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim().slice(0, 300);
  if (typeof b.notes === "string") patch.notes = b.notes.trim().slice(0, 20000) || null;
  if (typeof b.status === "string" && STATUSES.includes(b.status)) {
    patch.status = b.status;
    patch.completed_at = b.status === "done" ? new Date().toISOString() : null;
    patch.today_on = b.status === "today" && isDay(b.todayOn) ? b.todayOn : null;
  }
  if (typeof b.priority === "string" && PRIORITIES.includes(b.priority)) patch.priority = b.priority;
  if (b.dueDate === null || b.dueDate === "") patch.due_date = null;
  else if (isDay(b.dueDate)) patch.due_date = b.dueDate;
  const { data, error } = await createServerClient().from("ef_tasks").update(patch).eq("id", b.id).eq("master_plan_id", g.planId).select(SELECT).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  if (typeof b.id !== "string") return NextResponse.json({ error: "Missing task." }, { status: 400 });
  await createServerClient().from("ef_tasks").delete().eq("id", b.id).eq("master_plan_id", g.planId);
  return NextResponse.json({ ok: true });
}
