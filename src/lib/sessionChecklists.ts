import { createServerClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServerClient>;

// Session checklists (Babs, 2026-10-11): each MasterClass and Incubator session has a template checklist
// (about 28 steps). Only the session that is coming up lives in the task list (LCCS Tasks); the later sessions
// wait in session_event_items and are shown on Alignment Architect > Session Checklists. The morning after a
// session, the next one is added to the task list automatically (the daily cron), or Babs can add one early.

export const KINDS = ["masterclass", "incubator"] as const;
export type Kind = (typeof KINDS)[number];

export interface SessionEvent {
  id: string;
  master_plan_id: string;
  kind: Kind;
  title: string;
  session_date: string;
  business_id: number | null;
  project_id: string | null;
  status: "scheduled" | "active" | "done";
}

/** Today's date in Mountain time as YYYY-MM-DD (the sessions are Mountain-time events). */
export function todayMT(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Add one scheduled session's checklist to the task list. Safe to call twice: a session activates once. */
export async function activateEvent(db: Db, eventId: string): Promise<{ ok: boolean; added: number; error?: string }> {
  const { data: ev } = await db.from("session_events").select("*").eq("id", eventId).maybeSingle();
  if (!ev) return { ok: false, added: 0, error: "That session wasn't found." };
  const e = ev as SessionEvent;
  if (e.status !== "scheduled") return { ok: true, added: 0 };

  // Claim it first so two overlapping runs can't both add the tasks.
  const { data: claim } = await db
    .from("session_events")
    .update({ status: "active", activated_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("status", "scheduled")
    .select("id");
  if (!claim?.length) return { ok: true, added: 0 };

  const { data: proj, error: pErr } = await db
    .from("projects")
    .insert({ master_plan_id: e.master_plan_id, name: e.title, goal: `Checklist for the ${e.title} session`, status: "active", due_date: e.session_date })
    .select("id")
    .single();
  if (pErr || !proj) {
    await db.from("session_events").update({ status: "scheduled", activated_at: null }).eq("id", eventId);
    return { ok: false, added: 0, error: "Couldn't create the project." };
  }
  const { data: items } = await db.from("session_event_items").select("*").eq("event_id", eventId).order("position");
  const rows = ((items ?? []) as { title: string; description: string | null; priority: string | null; status: string; owner_action: boolean; energy: string | null; time_kind: string | null }[]).map((i) => ({
    master_plan_id: e.master_plan_id,
    project_id: proj.id as string,
    business_id: e.business_id,
    title: i.title,
    description: i.description,
    priority: i.priority || "medium",
    status: i.status || "backlog",
    owner_action: i.owner_action,
    energy: i.energy,
    time_kind: i.time_kind || "deadline",
  }));
  if (rows.length) {
    const { error } = await db.from("tasks").insert(rows);
    if (error) {
      await db.from("projects").delete().eq("id", proj.id as string);
      await db.from("session_events").update({ status: "scheduled", activated_at: null }).eq("id", eventId);
      return { ok: false, added: 0, error: "Couldn't add the tasks." };
    }
  }
  await db.from("session_events").update({ project_id: proj.id as string }).eq("id", eventId);
  return { ok: true, added: rows.length };
}

/** The daily roll-over: finished sessions are marked done, and when a kind has no session in play, the next one starts. */
export async function rollSessions(db: Db, planId: string, today = todayMT()): Promise<{ closed: number; activated: string[] }> {
  let closed = 0;
  const activated: string[] = [];
  for (const kind of KINDS) {
    const { data } = await db.from("session_events").select("*").eq("master_plan_id", planId).eq("kind", kind).order("session_date");
    const events = (data ?? []) as SessionEvent[];
    for (const e of events) {
      if (e.status === "active" && e.session_date < today) {
        await db.from("session_events").update({ status: "done" }).eq("id", e.id);
        e.status = "done";
        closed++;
      }
    }
    if (events.some((e) => e.status === "active")) continue;
    const next = events.find((e) => e.status === "scheduled" && e.session_date >= today);
    if (next) {
      const r = await activateEvent(db, next.id);
      if (r.ok && r.added) activated.push(next.title);
    }
  }
  return { closed, activated };
}
