import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../crm/guard";

export const dynamic = "force-dynamic";

// Time tracking (task 1154).
//   GET ?from=ISO&to=ISO   -> entries in the range (everyone in the account), my running timer, settings, and the
//                             clients, projects and open tasks to pick from
//   POST { action: "start" | "stop" | "add" | "update" | "delete" | "settings", ... }
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const COLS = "id, person_email, contact_id, project_id, task_id, note, started_at, ended_at, billable, rate";

export async function GET(request: Request) {
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const u = new URL(request.url);
  const from = u.searchParams.get("from") || new Date(Date.now() - 7 * 86_400_000).toISOString();
  const to = u.searchParams.get("to") || new Date(Date.now() + 86_400_000).toISOString();
  const me = a.userEmail || "owner";
  const [{ data: entries }, { data: running }, { data: settings }, { data: projects }, { data: tasks }] = await Promise.all([
    db.from("time_entries").select(COLS).eq("master_plan_id", a.planId).gte("started_at", from).lt("started_at", to).order("started_at", { ascending: false }).limit(2000),
    db.from("time_entries").select(COLS).eq("master_plan_id", a.planId).eq("person_email", me).is("ended_at", null).maybeSingle(),
    db.from("time_settings").select("weekly_capacity_hours, default_rate, client_rates").eq("master_plan_id", a.planId).maybeSingle(),
    db.from("projects").select("id, name").eq("master_plan_id", a.planId).order("name").limit(300),
    db.from("tasks").select("id, title, project_id").eq("master_plan_id", a.planId).neq("status", "done").is("archived_at", null).order("updated_at", { ascending: false }).limit(300),
  ]);
  const contactIds = Array.from(new Set([...((entries ?? []) as { contact_id: string | null }[]).map((e) => e.contact_id), (running as { contact_id?: string | null } | null)?.contact_id ?? null, ...Object.keys(((settings?.client_rates as Record<string, number>) ?? {}))].filter(Boolean))) as string[];
  const { data: people } = contactIds.length ? await db.from("seq_contacts").select("id, first_name, last_name, email").in("id", contactIds) : { data: [] };
  return NextResponse.json({
    me,
    entries: entries ?? [],
    running: running ?? null,
    settings: { weeklyCapacityHours: Number(settings?.weekly_capacity_hours ?? 30), defaultRate: settings?.default_rate == null ? null : Number(settings.default_rate), clientRates: (settings?.client_rates as Record<string, number>) ?? {} },
    contacts: ((people ?? []) as { id: string; first_name: string | null; last_name: string | null; email: string }[]).map((p) => ({ id: p.id, name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email })),
    projects: projects ?? [],
    tasks: tasks ?? [],
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return a.denied;
  const db = createServerClient();
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const me = a.userEmail || "owner";
  const planId: string = a.planId;
  const now = new Date().toISOString();

  // Only this account's own clients, projects and tasks can be linked.
  async function links() {
    const out: { contact_id: string | null; project_id: string | null; task_id: number | null } = { contact_id: null, project_id: null, task_id: null };
    if (str(b.contactId, 60)) out.contact_id = ((await db.from("seq_contacts").select("id").eq("id", str(b.contactId, 60)).eq("master_plan_id", planId).maybeSingle()).data?.id as string) ?? null;
    if (str(b.projectId, 60)) out.project_id = ((await db.from("projects").select("id").eq("id", str(b.projectId, 60)).eq("master_plan_id", planId).maybeSingle()).data?.id as string) ?? null;
    if (Number(b.taskId) > 0) {
      const { data: t } = await db.from("tasks").select("id, project_id").eq("id", Number(b.taskId)).eq("master_plan_id", planId).maybeSingle();
      out.task_id = (t?.id as number) ?? null;
      if (t?.project_id && !out.project_id) out.project_id = t.project_id as string;
    }
    return out;
  }
  async function rateFor(contactId: string | null): Promise<number | null> {
    if (b.rate !== undefined && b.rate !== null && b.rate !== "") return Number(b.rate) >= 0 ? Math.round(Number(b.rate) * 100) / 100 : null;
    const { data: s } = await db.from("time_settings").select("default_rate, client_rates").eq("master_plan_id", planId).maybeSingle();
    const cr = (s?.client_rates as Record<string, number>) ?? {};
    const r = contactId && cr[contactId] != null ? cr[contactId] : s?.default_rate;
    return r == null ? null : Number(r);
  }

  switch (b.action) {
    case "start": {
      await db.from("time_entries").update({ ended_at: now, updated_at: now }).eq("master_plan_id", planId).eq("person_email", me).is("ended_at", null);
      const l = await links();
      const { error } = await db.from("time_entries").insert({ master_plan_id: planId, person_email: me, ...l, note: str(b.note, 500) || null, started_at: now, billable: b.billable !== false, rate: await rateFor(l.contact_id) });
      return error ? NextResponse.json({ error: "The timer didn't start." }, { status: 500 }) : NextResponse.json({ ok: true });
    }
    case "stop": {
      await db.from("time_entries").update({ ended_at: now, updated_at: now }).eq("master_plan_id", planId).eq("person_email", me).is("ended_at", null);
      return NextResponse.json({ ok: true });
    }
    case "add": {
      const start = Date.parse(str(b.startedAt, 40));
      const minutes = Math.floor(Number(b.minutes));
      if (!Number.isFinite(start) || !(minutes > 0 && minutes <= 24 * 60)) return NextResponse.json({ error: "Enter a start time and between 1 minute and 24 hours." }, { status: 400 });
      const l = await links();
      await db.from("time_entries").insert({ master_plan_id: planId, person_email: me, ...l, note: str(b.note, 500) || null, started_at: new Date(start).toISOString(), ended_at: new Date(start + minutes * 60_000).toISOString(), billable: b.billable !== false, rate: await rateFor(l.contact_id) });
      return NextResponse.json({ ok: true });
    }
    case "update": {
      const patch: Record<string, unknown> = { updated_at: now };
      if (b.note !== undefined) patch.note = str(b.note, 500) || null;
      if (typeof b.billable === "boolean") patch.billable = b.billable;
      if (b.rate !== undefined) patch.rate = b.rate === null || b.rate === "" ? null : Math.max(0, Math.round(Number(b.rate) * 100) / 100);
      if (b.minutes !== undefined) {
        const { data: e } = await db.from("time_entries").select("started_at, ended_at").eq("id", str(b.id, 60)).eq("master_plan_id", planId).maybeSingle();
        const m = Math.floor(Number(b.minutes));
        if (e?.ended_at && m > 0 && m <= 24 * 60) patch.ended_at = new Date(Date.parse(e.started_at as string) + m * 60_000).toISOString();
      }
      if (b.contactId !== undefined || b.projectId !== undefined || b.taskId !== undefined) Object.assign(patch, await links());
      await db.from("time_entries").update(patch).eq("id", str(b.id, 60)).eq("master_plan_id", planId);
      return NextResponse.json({ ok: true });
    }
    case "delete":
      await db.from("time_entries").delete().eq("id", str(b.id, 60)).eq("master_plan_id", planId);
      return NextResponse.json({ ok: true });
    case "settings": {
      const cap = Number(b.weeklyCapacityHours);
      const rates: Record<string, number> = {};
      if (b.clientRates && typeof b.clientRates === "object") for (const [k, v] of Object.entries(b.clientRates as Record<string, unknown>)) if (/^[0-9a-f-]{36}$/.test(k) && Number(v) >= 0) rates[k] = Math.round(Number(v) * 100) / 100;
      await db.from("time_settings").upsert({
        master_plan_id: planId,
        weekly_capacity_hours: cap > 0 && cap <= 120 ? cap : 30,
        default_rate: b.defaultRate === null || b.defaultRate === "" || b.defaultRate === undefined ? null : Math.max(0, Number(b.defaultRate)),
        client_rates: rates,
        updated_at: now,
      }, { onConflict: "master_plan_id" });
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
