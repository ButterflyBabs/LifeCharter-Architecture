import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { dayInTz } from "@/lib/tz";
import { createProject, clean, isDay } from "@/lib/projects/server";
import { TEMPLATES } from "@/lib/projects/templates";
import { logActivity, q } from "@/lib/activity";

export const dynamic = "force-dynamic";

// GET: every project with how far along it is. POST: create one, blank or from a template.
export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ projects: [], templates: [] });
  const db = createServerClient();
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const [{ data: projects }, { data: tasks }, { data: members }] = await Promise.all([
    db.from("projects").select("*").eq("master_plan_id", planId).order("created_at", { ascending: false }),
    db.from("tasks").select("id, project_id, status, due_at, title").eq("master_plan_id", planId).not("project_id", "is", null),
    db.from("project_milestones").select("project_id, title, due_date, done").eq("master_plan_id", planId),
  ]);
  const by = new Map<string, { total: number; done: number; next: { title: string; day: string } | null }>();
  for (const t of (tasks ?? []) as { project_id: string; status: string; due_at: string | null; title: string }[]) {
    const e = by.get(t.project_id) ?? { total: 0, done: 0, next: null };
    e.total++;
    if (t.status === "done") e.done++;
    else if (t.due_at) {
      const day = dayInTz(t.due_at, tz);
      if (!e.next || day < e.next.day) e.next = { title: t.title, day };
    }
    by.set(t.project_id, e);
  }
  const ms = new Map<string, number>();
  for (const m of (members ?? []) as { project_id: string; done: boolean }[]) if (!m.done) ms.set(m.project_id, (ms.get(m.project_id) ?? 0) + 1);
  return NextResponse.json({
    projects: ((projects ?? []) as Record<string, unknown>[]).map((p) => {
      const s = by.get(p.id as string) ?? { total: 0, done: 0, next: null };
      return { id: p.id, name: p.name, goal: p.goal, status: p.status, startDate: p.start_date, dueDate: p.due_date, color: p.color, templateKey: p.template_key, tasks: s.total, done: s.done, next: s.next, openMilestones: ms.get(p.id as string) ?? 0 };
    }),
    templates: TEMPLATES.map((t) => ({ key: t.key, name: t.name, blurb: t.blurb, anchorLabel: t.anchorLabel, tasks: t.tasks.length })),
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const name = clean(b.name, 160);
  const tpl = typeof b.template === "string" && TEMPLATES.some((t) => t.key === b.template) ? b.template : null;
  if (!name && !tpl) return NextResponse.json({ error: "Give the project a name." }, { status: 400 });
  if (tpl && !isDay(b.anchorDay)) return NextResponse.json({ error: "Pick the date to plan around." }, { status: 400 });
  const tz = await resolveUserTimeZone(typeof b.tz === "string" ? b.tz : null);
  try {
    const res = await createProject(createServerClient(), planId, { name, goal: b.goal, templateKey: tpl, anchorDay: b.anchorDay, startDay: b.startDay, dueDay: b.dueDay }, tz);
    await logActivity({ masterPlanId: planId, action: "created", entityType: "project", entityId: undefined, summary: `Created project ${q(name || String(tpl))}` });
    return NextResponse.json({ id: res.id, tasks: res.taskIds.length });
  } catch (e) {
    console.error("POST /api/projects:", e);
    return NextResponse.json({ error: "Couldn't create the project." }, { status: 500 });
  }
}
