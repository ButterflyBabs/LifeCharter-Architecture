import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { dayInTz } from "@/lib/tz";
import { isDueOn, scheduleLabel, type RecurringRule } from "@/lib/recurring";
import { nowParts } from "@/lib/finance/period";
import { LEGAL_ITEMS } from "@/lib/legalChecklist";
import { ownTasksMemberId } from "@/lib/taskAssignees";

export const dynamic = "force-dynamic";

// One list for everything outstanding (Babs, 2026-10-15): the Tasks page also shows open work that lives elsewhere
// (reminders, project milestones, legal checklist items, recurring tasks due today, huddle to-dos and the assistant's
// next steps for the client), each linked back to where it lives and completed from there. Nothing is copied.
//   GET  → { items: LinkedItem[] }
//   POST { kind, id, step? } → marks that one item done where it lives

export type LinkedKind = "reminder" | "milestone" | "legal" | "recurring" | "huddle" | "assistant";
export interface LinkedItem {
  key: string;
  kind: LinkedKind;
  id: string;
  title: string;
  dueDay: string | null; // YYYY-MM-DD in the client's zone
  dueLabel?: string; // e.g. "3:00 PM"
  context?: string; // project name, agenda title…
  href: string;
  step?: number; // assistant checklist step index (id is the report id)
}

const ASSISTANT_STEP_KIND = new Set(["you", "both"]);

export async function GET(request: Request) {
  const planId = await resolveMasterPlanId();
  if (!planId || (await ownTasksMemberId())) return NextResponse.json({ items: [] });
  const db = createServerClient();
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const { year, month, day } = nowParts(tz);
  const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const items: LinkedItem[] = [];
  const time = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  const [rem, ms, legal, rec, hud, rep] = await Promise.all([
    db.from("reminders").select("id, title, remind_at").eq("master_plan_id", planId).eq("status", "open").order("remind_at").limit(200),
    db.from("project_milestones").select("id, title, due_date, project_id, projects(name)").eq("master_plan_id", planId).eq("done", false).limit(300),
    db.from("legal_checklist").select("item_key, status, due_date, custom_title, business_id").eq("master_plan_id", planId).in("status", ["not_started", "in_progress"]).limit(200),
    db.from("recurring_tasks").select("id, title, cadence, days_of_week, day_of_month, time_of_day").eq("master_plan_id", planId).limit(200),
    db.from("team_huddles").select("id, title, call_date, actions").eq("master_plan_id", planId).order("call_date", { ascending: false }).limit(12),
    db.from("assistant_reports").select("id, item_type, item_key, item_title, report, created_at").eq("master_plan_id", planId).order("created_at", { ascending: false }).limit(200),
  ]);

  for (const r of (rem.data ?? []) as { id: string; title: string; remind_at: string }[]) {
    items.push({ key: `reminder:${r.id}`, kind: "reminder", id: r.id, title: r.title, dueDay: dayInTz(r.remind_at, tz), dueLabel: time(r.remind_at), href: "/reminders" });
  }

  for (const m of (ms.data ?? []) as unknown as { id: string; title: string; due_date: string | null; project_id: string; projects: { name: string } | { name: string }[] | null }[]) {
    const pn = Array.isArray(m.projects) ? m.projects[0]?.name : m.projects?.name;
    items.push({ key: `milestone:${m.id}`, kind: "milestone", id: m.id, title: m.title, dueDay: m.due_date, context: pn, href: `/projects/${m.project_id}` });
  }

  const legalTitle = new Map(LEGAL_ITEMS.map((i) => [i.key, i.title]));
  const seenLegal = new Set<string>();
  for (const l of (legal.data ?? []) as { item_key: string; due_date: string | null; custom_title: string | null }[]) {
    if (seenLegal.has(l.item_key)) continue;
    seenLegal.add(l.item_key);
    items.push({ key: `legal:${l.item_key}`, kind: "legal", id: l.item_key, title: l.custom_title || legalTitle.get(l.item_key) || l.item_key, dueDay: l.due_date, context: "Legal & Compliance", href: "/compliance" });
  }

  const recRows = ((rec.data ?? []) as (RecurringRule & { id: string; title: string; time_of_day: string | null })[]).filter((r) => isDueOn(r, year, month, day));
  if (recRows.length) {
    const { data: done } = await db.from("recurring_task_completions").select("recurring_task_id").eq("done_on", today).in("recurring_task_id", recRows.map((r) => r.id));
    const doneIds = new Set((done ?? []).map((d) => d.recurring_task_id as string));
    for (const r of recRows) {
      if (doneIds.has(r.id)) continue;
      items.push({ key: `recurring:${r.id}`, kind: "recurring", id: r.id, title: r.title, dueDay: today, context: scheduleLabel(r), href: "/tasks" });
    }
  }

  for (const h of (hud.data ?? []) as { id: string; title: string; call_date: string; actions: { id: string; text: string; due: string; done: boolean }[] | null }[]) {
    for (const a of h.actions ?? []) {
      if (a.done || !a.text?.trim()) continue;
      items.push({ key: `huddle:${h.id}:${a.id}`, kind: "huddle", id: `${h.id}:${a.id}`, title: a.text, dueDay: /^\d{4}-\d{2}-\d{2}$/.test(a.due || "") ? a.due : null, context: h.title || "Team Huddle", href: "/team-huddle" });
    }
  }

  const seen = new Set<string>();
  for (const r of (rep.data ?? []) as { id: string; item_type: string; item_key: string; item_title: string; report: { next_steps?: { who?: string; status?: string; text?: string }[] } }[]) {
    const k = `${r.item_type}:${r.item_key}`;
    if (seen.has(k)) continue;
    seen.add(k);
    (r.report?.next_steps ?? []).forEach((st, index) => {
      if (st.who && ASSISTANT_STEP_KIND.has(st.who) && st.status !== "done" && st.status !== "scheduled" && st.text) {
        items.push({ key: `assistant:${r.id}:${index}`, kind: "assistant", id: r.id, step: index, title: st.text, dueDay: null, context: r.item_title, href: "/assistant-approvals" });
      }
    });
  }

  return NextResponse.json({ items, today });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (await ownTasksMemberId()) return NextResponse.json({ error: "Not available for your role." }, { status: 403 });
  const b = await request.json().catch(() => ({}));
  const kind = String(b.kind || "");
  const id = String(b.id || "");
  const db = createServerClient();
  const now = new Date().toISOString();

  if (kind === "reminder") {
    const { data, error } = await db.from("reminders").update({ status: "done", done_at: now, updated_at: now }).eq("id", id).eq("master_plan_id", planId).select("id");
    if (error || !data?.length) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  } else if (kind === "milestone") {
    const { data, error } = await db.from("project_milestones").update({ done: true }).eq("id", id).eq("master_plan_id", planId).select("id");
    if (error || !data?.length) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  } else if (kind === "legal") {
    const { error } = await db.from("legal_checklist").update({ status: "done", updated_at: now }).eq("master_plan_id", planId).eq("item_key", id);
    if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  } else if (kind === "recurring") {
    const tz = await resolveUserTimeZone(typeof b.tz === "string" ? b.tz : null);
    const { year, month, day } = nowParts(tz);
    const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const { data: own } = await db.from("recurring_tasks").select("id").eq("id", id).eq("master_plan_id", planId).maybeSingle();
    if (!own) return NextResponse.json({ error: "not found" }, { status: 404 });
    const { error } = await db.from("recurring_task_completions").upsert({ recurring_task_id: id, done_on: today }, { onConflict: "recurring_task_id,done_on" });
    if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  } else if (kind === "huddle") {
    const [huddleId, actionId] = id.split(":");
    const { data: h } = await db.from("team_huddles").select("id, actions").eq("id", huddleId).eq("master_plan_id", planId).maybeSingle();
    if (!h) return NextResponse.json({ error: "not found" }, { status: 404 });
    const actions = ((h.actions as { id: string; done: boolean }[] | null) ?? []).map((a) => (a.id === actionId ? { ...a, done: true } : a));
    const { error } = await db.from("team_huddles").update({ actions, updated_at: now }).eq("id", huddleId).eq("master_plan_id", planId);
    if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  } else {
    return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
