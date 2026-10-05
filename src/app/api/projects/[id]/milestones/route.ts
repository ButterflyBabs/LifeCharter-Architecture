import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { loadProject, clean, isDay } from "@/lib/projects/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  if (!(await loadProject(db, planId, params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const title = clean(b.title, 160);
  if (!title) return NextResponse.json({ error: "A milestone needs a name." }, { status: 400 });
  const { data, error } = await db.from("project_milestones").insert({ project_id: params.id, master_plan_id: planId, title, due_date: isDay(b.dueDay) ? b.dueDay : null }).select("id, title, due_date, done").single();
  if (error || !data) return NextResponse.json({ error: "Couldn't add it." }, { status: 500 });
  return NextResponse.json({ milestone: { id: data.id, title: data.title, dueDay: data.due_date, done: data.done } });
}
