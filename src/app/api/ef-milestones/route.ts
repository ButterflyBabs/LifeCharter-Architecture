import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/planScope";

export const dynamic = "force-dynamic";

// Embraced;Fully project milestones: Alignment Architect (Babs) only.
//   GET [?projectId=]  POST { projectId, title, dueDate? }  PATCH { id, title?, done?, dueDate? }  DELETE { id }
async function gate() {
  if (!(await isAlignmentArchitect())) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) } as const;
  const planId = await housePlanId();
  if (!planId) return { error: NextResponse.json({ error: "No house account found." }, { status: 500 }) } as const;
  return { planId } as const;
}
const SELECT = "id, project_id, title, due_date, done, sort_order";
const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request: Request) {
  const g = await gate();
  if ("error" in g) return g.error;
  const projectId = new URL(request.url).searchParams.get("projectId");
  let q = createServerClient().from("ef_milestones").select(SELECT).eq("master_plan_id", g.planId);
  if (projectId) q = q.eq("project_id", projectId);
  const { data } = await q.order("due_date", { ascending: true, nullsFirst: false }).order("sort_order").limit(1000);
  return NextResponse.json({ milestones: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 200) : "";
  if (!title || typeof b.projectId !== "string") return NextResponse.json({ error: "Name the milestone." }, { status: 400 });
  const db = createServerClient();
  const { data: own } = await db.from("ef_projects").select("id").eq("id", b.projectId).eq("master_plan_id", g.planId).maybeSingle();
  if (!own) return NextResponse.json({ error: "Unknown project." }, { status: 404 });
  const { data, error } = await db.from("ef_milestones").insert({ master_plan_id: g.planId, project_id: own.id, title, due_date: isDay(b.dueDate) ? b.dueDate : null }).select(SELECT).single();
  if (error) return NextResponse.json({ error: "Couldn't add it." }, { status: 500 });
  return NextResponse.json({ milestone: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  if (typeof b.id !== "string") return NextResponse.json({ error: "Missing milestone." }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim().slice(0, 200);
  if (typeof b.done === "boolean") patch.done = b.done;
  if (b.dueDate === null || b.dueDate === "") patch.due_date = null;
  else if (isDay(b.dueDate)) patch.due_date = b.dueDate;
  const { data, error } = await createServerClient().from("ef_milestones").update(patch).eq("id", b.id).eq("master_plan_id", g.planId).select(SELECT).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ milestone: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  if (typeof b.id !== "string") return NextResponse.json({ error: "Missing milestone." }, { status: 400 });
  await createServerClient().from("ef_milestones").delete().eq("id", b.id).eq("master_plan_id", g.planId);
  return NextResponse.json({ ok: true });
}
