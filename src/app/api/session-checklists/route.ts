import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAlignmentArchitect } from "@/lib/authz";
import { housePlanId } from "@/lib/housePlan";

export const dynamic = "force-dynamic";

// Session Checklists (Alignment Architect only): every MasterClass and Incubator session with its whole checklist.
// A session in play shows its live tasks (so ticks made on the Tasks page show here); a scheduled one shows the
// template steps waiting to be added to the task list.
export async function GET() {
  if (!(await isAlignmentArchitect())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const db = createServerClient();
  const house = await housePlanId(db);
  if (!house) return NextResponse.json({ events: [] });
  const { data: evs } = await db.from("session_events").select("*").eq("master_plan_id", house).order("session_date");
  const events = (evs ?? []) as { id: string; kind: string; title: string; session_date: string; status: string; project_id: string | null; activated_at: string | null }[];

  const projectIds = events.map((e) => e.project_id).filter(Boolean) as string[];
  const { data: tasks } = projectIds.length
    ? await db.from("tasks").select("id, title, status, owner_action, due_date, project_id").in("project_id", projectIds).order("id")
    : { data: [] as never[] };
  const byProject = new Map<string, { id: number; title: string; status: string; owner_action: boolean; due_date: string | null }[]>();
  for (const t of (tasks ?? []) as { id: number; title: string; status: string; owner_action: boolean; due_date: string | null; project_id: string }[]) {
    byProject.set(t.project_id, [...(byProject.get(t.project_id) ?? []), t]);
  }
  const scheduledIds = events.filter((e) => e.status === "scheduled").map((e) => e.id);
  const { data: items } = scheduledIds.length
    ? await db.from("session_event_items").select("event_id, position, title, owner_action").in("event_id", scheduledIds).order("position")
    : { data: [] as never[] };
  const byEvent = new Map<string, { title: string; owner_action: boolean }[]>();
  for (const i of (items ?? []) as { event_id: string; title: string; owner_action: boolean }[]) {
    byEvent.set(i.event_id, [...(byEvent.get(i.event_id) ?? []), i]);
  }

  const out = events.map((e) => {
    const live = e.project_id ? byProject.get(e.project_id) ?? [] : [];
    const tmpl = byEvent.get(e.id) ?? [];
    const list = e.status === "scheduled" ? tmpl.map((t) => ({ title: t.title, done: false, mine: !t.owner_action })) : live.map((t) => ({ title: t.title, done: t.status === "done", mine: !t.owner_action }));
    return {
      id: e.id,
      kind: e.kind,
      title: e.title,
      date: e.session_date,
      status: e.status,
      total: list.length,
      done: list.filter((x) => x.done).length,
      items: list,
    };
  });
  return NextResponse.json({ events: out }, { headers: { "Cache-Control": "no-store" } });
}
