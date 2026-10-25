import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { efGate, loadEfProject, clean, isDay } from "@/lib/ef/server";

export const dynamic = "force-dynamic";

// Add a milestone to an Embraced;Fully project: { title, dueDay? }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await efGate();
  if ("error" in g) return g.error;
  const db = createServerClient();
  if (!(await loadEfProject(db, g.planId, params.id))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const b = await request.json().catch(() => ({}));
  const title = clean(b.title, 200);
  if (!title) return NextResponse.json({ error: "Name the milestone." }, { status: 400 });
  const { error } = await db.from("ef_milestones").insert({ master_plan_id: g.planId, project_id: params.id, title, due_date: isDay(b.dueDay) ? b.dueDay : null });
  if (error) return NextResponse.json({ error: "Couldn't add it." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
