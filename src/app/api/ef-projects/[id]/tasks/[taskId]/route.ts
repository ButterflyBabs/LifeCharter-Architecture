import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { efGate, loadEfProject, efTaskPatch, shapeEfTask, EF_TASK_COLS } from "@/lib/ef/server";

export const dynamic = "force-dynamic";

const numId = (v: string) => (/^\d{1,15}$/.test(v) ? Number(v) : null);

// Edit a card (the id in the path is the task's num_id): title, notes, stage, priority, dates, board position.
export async function PATCH(request: Request, { params }: { params: { id: string; taskId: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  const db = createServerClient();
  const n = numId(params.taskId);
  if (n === null || !(await loadEfProject(db, g.planId, params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const tz = await resolveUserTimeZone(typeof b.tz === "string" ? b.tz : null);
  const { update, error } = efTaskPatch(b, tz);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { data, error: e2 } = await db.from("ef_tasks").update(update).eq("num_id", n).eq("master_plan_id", g.planId).eq("project_id", params.id).select(EF_TASK_COLS).maybeSingle();
  if (e2 || !data) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ task: shapeEfTask(data as Record<string, unknown>) });
}

export async function DELETE(request: Request, { params }: { params: { id: string; taskId: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  const n = numId(params.taskId);
  if (n === null) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data } = await createServerClient().from("ef_tasks").delete().eq("num_id", n).eq("master_plan_id", g.planId).eq("project_id", params.id).select("id").maybeSingle();
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
