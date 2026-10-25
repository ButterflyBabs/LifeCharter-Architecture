import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { efGate, loadEfProject, efTaskPatch, shapeEfTask, EF_TASK_COLS, EF_PRIORITIES, EF_TASK_STATUSES, clean } from "@/lib/ef/server";

export const dynamic = "force-dynamic";

// Add a task to an Embraced;Fully project: { title, status?, priority?, startDay?, dueDay?, description? }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  const db = createServerClient();
  if (!(await loadEfProject(db, g.planId, params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const title = clean(b.title, 300);
  if (!title) return NextResponse.json({ error: "A task needs a title." }, { status: 400 });
  const tz = await resolveUserTimeZone(typeof b.tz === "string" ? b.tz : null);
  const status = (EF_TASK_STATUSES as readonly string[]).includes(b.status) ? (b.status as string) : "backlog";
  const { update, error } = efTaskPatch({ ...b, status, title }, tz);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { count } = await db.from("ef_tasks").select("id", { count: "exact", head: true }).eq("master_plan_id", g.planId).eq("project_id", params.id).eq("status", status);
  const row = { ...update, master_plan_id: g.planId, project_id: params.id, board_position: count ?? 0, priority: (EF_PRIORITIES as readonly string[]).includes(b.priority) ? b.priority : "medium" };
  const { data, error: e2 } = await db.from("ef_tasks").insert(row).select(EF_TASK_COLS).single();
  if (e2 || !data) return NextResponse.json({ error: "Couldn't add the task." }, { status: 500 });
  return NextResponse.json({ task: shapeEfTask(data as Record<string, unknown>) });
}
