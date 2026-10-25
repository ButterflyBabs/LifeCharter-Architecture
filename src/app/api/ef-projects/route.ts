import { NextResponse } from "next/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { housePlanId } from "@/lib/planScope";

export const dynamic = "force-dynamic";

// Embraced;Fully projects: Alignment Architect (Babs) only. Groups for the E:F task list.
//   GET → { projects }   POST { name, goal?, dueDate? }   PATCH { id, name?, goal?, status?, dueDate? }   DELETE { id }
async function gate() {
  if (!(await isAlignmentArchitect())) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) } as const;
  const planId = await housePlanId();
  if (!planId) return { error: NextResponse.json({ error: "No house account found." }, { status: 500 }) } as const;
  return { planId } as const;
}
const SELECT = "id, name, goal, status, due_date, sort_order, created_at, parent_id";
const PALETTE = ["#2E7C83", "#c9a227", "#7b6b8d", "#c9855e", "#4a9b9b", "#8fb58a"];
const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request: Request) {
  const g = await gate();
  if ("error" in g) return g.error;
  // ?overview=1: the project cards (progress, next task, milestones ahead), the same shape as /api/projects.
  if (new URL(request.url).searchParams.get("overview")) {
    const db = createServerClient();
    const [{ data: projects }, { data: tasks }, { data: ms }] = await Promise.all([
      db.from("ef_projects").select("id, name, goal, status, start_date, due_date, color, parent_id, sort_order, created_at").eq("master_plan_id", g.planId).order("sort_order").order("created_at").limit(300),
      db.from("ef_tasks").select("project_id, status, due_date, title").eq("master_plan_id", g.planId).not("project_id", "is", null).limit(3000),
      db.from("ef_milestones").select("project_id, done").eq("master_plan_id", g.planId).limit(2000),
    ]);
    const by = new Map<string, { total: number; done: number; next: { title: string; day: string } | null }>();
    for (const t of (tasks ?? []) as { project_id: string; status: string; due_date: string | null; title: string }[]) {
      const e = by.get(t.project_id) ?? { total: 0, done: 0, next: null };
      e.total++;
      if (t.status === "done") e.done++;
      else if (t.due_date && (!e.next || t.due_date < e.next.day)) e.next = { title: t.title, day: t.due_date };
      by.set(t.project_id, e);
    }
    const open = new Map<string, number>();
    for (const m of (ms ?? []) as { project_id: string; done: boolean }[]) if (!m.done) open.set(m.project_id, (open.get(m.project_id) ?? 0) + 1);
    const rows = (projects ?? []) as { id: string; name: string; goal: string | null; status: string; start_date: string | null; due_date: string | null; color: string | null; parent_id: string | null }[];
    const nameOf = new Map(rows.map((r) => [r.id, r.name]));
    return NextResponse.json({
      projects: rows.map((r) => {
        const st = by.get(r.id) ?? { total: 0, done: 0, next: null };
        return { id: r.id, name: r.name, goal: r.goal, status: r.status, startDate: r.start_date, dueDate: r.due_date, color: r.color, parentId: r.parent_id, parentName: r.parent_id ? nameOf.get(r.parent_id) ?? null : null, tasks: st.total, done: st.done, next: st.next, openMilestones: open.get(r.id) ?? 0 };
      }),
    });
  }
  const { data } = await createServerClient().from("ef_projects").select(SELECT).eq("master_plan_id", g.planId).order("sort_order").order("created_at").limit(200);
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
  if (!name) return NextResponse.json({ error: "Name the project." }, { status: 400 });
  const db = createServerClient();
  const { count } = await db.from("ef_projects").select("id", { count: "exact", head: true }).eq("master_plan_id", g.planId);
  let parentId: string | null = null;
  if (typeof b.parentId === "string" && b.parentId) {
    // One level only: the parent must itself be a top-level project of this account.
    const { data: par } = await db.from("ef_projects").select("id, parent_id").eq("id", b.parentId).eq("master_plan_id", g.planId).maybeSingle();
    if (par && !par.parent_id) parentId = par.id as string;
  }
  const { data, error } = await db
    .from("ef_projects")
    .insert({ master_plan_id: g.planId, parent_id: parentId, color: PALETTE[(count ?? 0) % PALETTE.length], start_date: isDay(b.startDate) ? b.startDate : null, name, goal: typeof b.goal === "string" && b.goal.trim() ? b.goal.trim().slice(0, 2000) : null, due_date: isDay(b.dueDate) ? b.dueDate : null })
    .select(SELECT)
    .single();
  if (error) return NextResponse.json({ error: "Couldn't add it." }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  // { order: [id, id, ...] }: save a new drag-and-drop order (this account's projects only).
  if (Array.isArray(b.order)) {
    const ids = (b.order as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 500);
    const db = createServerClient();
    await Promise.all(ids.map((pid, i) => db.from("ef_projects").update({ sort_order: i + 1 }).eq("id", pid).eq("master_plan_id", g.planId)));
    return NextResponse.json({ ok: true });
  }
  if (typeof b.id !== "string") return NextResponse.json({ error: "Missing project." }, { status: 400 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.name === "string" && b.name.trim()) patch.name = b.name.trim().slice(0, 120);
  if (typeof b.goal === "string") patch.goal = b.goal.trim().slice(0, 2000) || null;
  if (typeof b.status === "string" && ["planning", "active", "on_hold", "done"].includes(b.status)) patch.status = b.status;
  if (b.dueDate === null || b.dueDate === "") patch.due_date = null;
  else if (isDay(b.dueDate)) patch.due_date = b.dueDate;
  if (b.parentId === null || b.parentId === "") patch.parent_id = null;
  else if (typeof b.parentId === "string" && b.parentId !== b.id) {
    const db0 = createServerClient();
    const [{ data: par }, { count: kids }] = await Promise.all([
      db0.from("ef_projects").select("id, parent_id").eq("id", b.parentId).eq("master_plan_id", g.planId).maybeSingle(),
      db0.from("ef_projects").select("id", { count: "exact", head: true }).eq("parent_id", b.id).eq("master_plan_id", g.planId),
    ]);
    if (!par || par.parent_id || (kids ?? 0) > 0) return NextResponse.json({ error: "A project can sit under one top-level project only." }, { status: 400 });
    patch.parent_id = par.id;
  }
  const { data, error } = await createServerClient().from("ef_projects").update(patch).eq("id", b.id).eq("master_plan_id", g.planId).select(SELECT).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const g = await gate();
  if ("error" in g) return g.error;
  const b = await request.json().catch(() => ({}));
  if (typeof b.id !== "string") return NextResponse.json({ error: "Missing project." }, { status: 400 });
  // Its tasks stay (they just lose the project): ef_tasks.project_id is set null on delete.
  await createServerClient().from("ef_projects").delete().eq("id", b.id).eq("master_plan_id", g.planId);
  return NextResponse.json({ ok: true });
}
