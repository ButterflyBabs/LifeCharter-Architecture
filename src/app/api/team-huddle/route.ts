import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { createServerClient } from "@/lib/supabase/server";
import { huddleAccess, huddleNames, loadSettings } from "@/lib/teamHuddleServer";
import { housePlanId } from "@/lib/housePlan";
import {
  carryOver, cleanActions, cleanAgenda, huddleToText, normEmail, templateAgenda, validEmail, totalMinutes,
  type HuddleAction,
} from "@/lib/teamHuddle";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Team Huddle. GET = the calls (and, for Babs, who it is shared with). POST = create | save | delete |
// share-add | share-edit | share-remove | email | to-tasks. Everything is editable by Babs; a shared
// person may edit only when she gave them edit access.

const COLS = "id, call_date, start_time, title, status, agenda, actions, notes, recording_url, summary, created_at, updated_at, transcript";
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

async function gate(shared: boolean) {
  const a = await huddleAccess({ shared });
  if (!a) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) } as const;
  return { a } as const;
}

// The transcript can be long, so the list carries only whether there is one; Babs's page reads the text with ?id=.
function shape(row: Record<string, unknown>, withTranscript: boolean) {
  const { transcript, ...rest } = row;
  return { ...rest, transcript: withTranscript ? transcript : "", transcript_len: typeof transcript === "string" ? transcript.length : 0 };
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const g = await gate(q.get("via") === "share");
  if ("error" in g) return g.error;
  const { a } = g;
  const db = createServerClient();
  const id = q.get("id");
  if (id) {
    const { data } = await db.from("team_huddles").select(COLS).eq("id", id).eq("master_plan_id", a.planId).maybeSingle();
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ huddle: shape(data as Record<string, unknown>, a.manage) });
  }
  const { data } = await db.from("team_huddles").select(COLS).eq("master_plan_id", a.planId).order("call_date", { ascending: false }).order("created_at", { ascending: false }).limit(80);
  const access = a.manage ? await db.from("team_huddle_access").select("email, name, can_edit, added_at").eq("master_plan_id", a.planId).order("added_at") : null;
  const [settings, names] = await Promise.all([loadSettings(db, a.planId), huddleNames(db, a.planId, a.ownerName)]);
  return NextResponse.json({
    me: { email: a.email, owner: a.manage, canEdit: a.canEdit, viewAs: a.viewAs },
    huddles: ((data ?? []) as Record<string, unknown>[]).map((r) => shape(r, false)),
    access: access?.data ?? [],
    settings,
    names,
  });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const g = await gate(b.via === "share");
  if ("error" in g) return g.error;
  const { a } = g;
  const db = createServerClient();
  const now = new Date().toISOString();
  const action = str(b.action, 30);

  const ownerOnly = ["create", "delete", "share-add", "share-edit", "share-remove", "email", "to-tasks", "settings-save", "template-save", "template-reset"];
  if (ownerOnly.includes(action) && !a.manage) return NextResponse.json({ error: "Only the person who runs this account can do that." }, { status: 403 });

  if (action === "create") {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(str(b.call_date, 10)) ? str(b.call_date, 10) : new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
    const settings = await loadSettings(db, a.planId);
    const { data: last } = await db.from("team_huddles").select("actions").eq("master_plan_id", a.planId).order("call_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const carried = carryOver(cleanActions(last?.actions));
    const { data, error } = await db
      .from("team_huddles")
      .insert({
        master_plan_id: a.planId,
        call_date: date,
        start_time: str(b.start_time, 5) || settings.start_time,
        title: str(b.title, 120) || settings.title,
        agenda: cleanAgenda(Array.isArray(b.agenda) ? b.agenda : settings.template ?? templateAgenda()),
        actions: Array.isArray(b.actions) ? cleanActions(b.actions) : carried,
      })
      .select(COLS)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ huddle: shape(data as Record<string, unknown>, true), carried: carried.length });
  }

  if (action === "save") {
    if (!a.canEdit) return NextResponse.json({ error: "You have view access only." }, { status: 403 });
    const id = str(b.id, 60);
    const p = (b.patch ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = { updated_at: now };
    if (typeof p.call_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.call_date)) patch.call_date = p.call_date;
    if (typeof p.start_time === "string") patch.start_time = str(p.start_time, 5) || "08:00";
    if (typeof p.title === "string") patch.title = str(p.title, 120) || "Weekly Team Huddle";
    if (p.status === "upcoming" || p.status === "done") patch.status = p.status;
    if (Array.isArray(p.agenda)) patch.agenda = cleanAgenda(p.agenda);
    if (Array.isArray(p.actions)) patch.actions = cleanActions(p.actions);
    if (typeof p.notes === "string") patch.notes = p.notes.slice(0, 20000);
    if (typeof p.recording_url === "string") patch.recording_url = str(p.recording_url, 500);
    if (a.manage && typeof p.transcript === "string") patch.transcript = p.transcript.slice(0, 200000);
    const { error } = await db.from("team_huddles").update(patch).eq("id", id).eq("master_plan_id", a.planId);
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true, updated_at: now });
  }

  if (action === "delete") {
    const { error } = await db.from("team_huddles").delete().eq("id", str(b.id, 60)).eq("master_plan_id", a.planId);
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  if (action === "share-add" || action === "share-edit" || action === "share-remove") {
    const email = normEmail(b.email);
    if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (action === "share-remove") {
      await db.from("team_huddle_access").delete().eq("email", email).eq("master_plan_id", a.planId);
      return NextResponse.json({ ok: true });
    }
    const row = { email, master_plan_id: a.planId, can_edit: b.canEdit === true, ...(typeof b.name === "string" ? { name: str(b.name, 60) } : {}) };
    const { error } = await db.from("team_huddle_access").upsert(row, { onConflict: "master_plan_id,email" });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  if (action === "settings-save") {
    const mx = Math.round(Number(b.max_minutes));
    const wd = b.weekday === null || b.weekday === "" ? null : Math.round(Number(b.weekday));
    const row = {
      master_plan_id: a.planId,
      title: str(b.title, 120) || "Weekly Team Huddle",
      max_minutes: Number.isFinite(mx) ? Math.max(5, Math.min(120, mx)) : 30,
      weekday: wd !== null && Number.isFinite(wd) && wd >= 0 && wd <= 6 ? wd : null,
      start_time: /^\d{2}:\d{2}$/.test(str(b.start_time, 5)) ? str(b.start_time, 5) : "08:00",
      updated_at: now,
    };
    const { error } = await db.from("team_huddle_settings").upsert(row, { onConflict: "master_plan_id" });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true, settings: await loadSettings(db, a.planId) });
  }

  if (action === "template-save") {
    // The agenda shown now (titles, minutes, prompts) becomes what every NEW huddle starts from.
    const { data: h } = await db.from("team_huddles").select("agenda").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
    if (!h) return NextResponse.json({ error: "not found" }, { status: 404 });
    const agenda = cleanAgenda(h.agenda);
    if (!agenda.length) return NextResponse.json({ error: "This agenda is empty." }, { status: 400 });
    const { error } = await db.from("team_huddle_settings").upsert({ master_plan_id: a.planId, template: agenda, updated_at: now }, { onConflict: "master_plan_id" });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true, minutes: totalMinutes(agenda) });
  }

  if (action === "template-reset") {
    const { error } = await db.from("team_huddle_settings").upsert({ master_plan_id: a.planId, template: null, updated_at: now }, { onConflict: "master_plan_id" });
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
  }

  if (action === "email") {
    const key = process.env.RESEND_API_KEY;
    if (!key) return NextResponse.json({ error: "Email is not set up here." }, { status: 503 });
    const { data: h } = await db.from("team_huddles").select(COLS).eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
    if (!h) return NextResponse.json({ error: "not found" }, { status: 404 });
    let to = (Array.isArray(b.to) ? b.to : []).map(normEmail).filter(validEmail);
    if (!to.length) {
      const { data: acc } = await db.from("team_huddle_access").select("email").eq("master_plan_id", a.planId);
      to = (acc ?? []).map((r) => normEmail(r.email)).filter(validEmail);
    }
    to = Array.from(new Set(to)).slice(0, 12);
    if (!to.length) return NextResponse.json({ error: "Add someone under Who can open this page first." }, { status: 400 });
    const text = huddleToText({
      title: h.title, call_date: h.call_date, start_time: h.start_time,
      agenda: cleanAgenda(h.agenda), actions: cleanActions(h.actions), notes: h.notes ?? "",
    });
    const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a2b4a;white-space:pre-wrap">${esc(text)}</div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "LifeCharter Command Suite <support@lccommandsuite.com>",
        to,
        reply_to: a.email || "support@lccommandsuite.com",
        subject: `Agenda: ${h.title} (${h.call_date}, ${h.start_time} MT)`,
        html,
        text,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "The email could not be sent." }, { status: 502 });
    return NextResponse.json({ ok: true, sent: to });
  }

  if (action === "to-tasks") {
    // Babs picks to-dos from a call and they become LCCS Tasks (the one list). Nothing is created without her pressing the button.
    const { data: h } = await db.from("team_huddles").select("call_date, actions").eq("id", str(b.id, 60)).eq("master_plan_id", a.planId).maybeSingle();
    if (!h) return NextResponse.json({ error: "not found" }, { status: 404 });
    const wanted = new Set((Array.isArray(b.actionIds) ? b.actionIds : []).map((x) => str(x, 24)));
    const picks = cleanActions(h.actions).filter((x) => wanted.has(x.id) && x.text.trim());
    if (!picks.length) return NextResponse.json({ error: "Nothing selected." }, { status: 400 });
    const house = (await housePlanId(db)) === a.planId;
    const mine = (o: string) => {
      const n = o.trim().toLowerCase();
      return Boolean(n) && (n === a.ownerName.toLowerCase() || (house && /^(babs|amilynne)/.test(n)));
    };
    const rows = picks.map((x: HuddleAction) => ({
      master_plan_id: a.planId,
      title: x.text.slice(0, 200),
      description: `From the Team Huddle on ${h.call_date}.${x.owner ? ` Owner: ${x.owner}.` : ""}`,
      status: "backlog",
      priority: "medium",
      energy: "medium",
      due_date: x.due ? `${x.due}T00:00:00Z` : null,
      followup: {},
      owner_action: mine(x.owner),
    }));
    const { error } = await db.from("tasks").insert(rows);
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true, created: rows.length });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
