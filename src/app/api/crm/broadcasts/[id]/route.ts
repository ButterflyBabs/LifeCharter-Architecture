import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { clientFrom, sendRendered } from "@/lib/sequences/engine";
import { BroadcastRow, listRecipients, problems, processBroadcast, renderBroadcast, sendCounts } from "@/lib/broadcasts/engine";
import { OWNER_TZ, zonedToUtc } from "@/lib/broadcasts/shared";
import { footerOf, senderProfile, senderVerdict } from "@/lib/email/accountSender";
import { crmAccount, testRecipient, type CrmAccount } from "../../guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One broadcast of the signed-in account (by id AND the account's plan; 404 otherwise).
//   GET → the broadcast, who it would reach, per-status send counts, what's missing
//   POST { action } with action one of:
//     save { draft }           → edit (draft or scheduled only; a scheduled one that's no longer ready goes back to draft)
//     count { draft }          → how many people the (unsaved) recipients pick reaches
//     preview { draft }        → the rendered email, as Eloise
//     test                     → the saved version, to the signed-in person
//     schedule { date, time }  → send then (the broadcast's time zone: Mountain for Babs, the client's own otherwise)
//     send-now                 → start now; the cron finishes anything left
//     unschedule | cancel | delete

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const FROM_RE = /^[^@\s]+@(lifecharter\.life|lccommandsuite\.com)$/i;

// The editable fields from the screen → table columns.
function fields(d: Record<string, unknown>, cur: BroadcastRow, house: boolean): Partial<BroadcastRow> {
  const tags = Array.isArray(d.tags) ? Array.from(new Set(d.tags.map((t) => str(t, 60).toLowerCase()).filter(Boolean))).slice(0, 20) : cur.tags;
  const vars: Record<string, string> = {};
  if (d.variables && typeof d.variables === "object") for (const [k, v] of Object.entries(d.variables as Record<string, unknown>)) if (/^[a-z0-9_]{1,40}$/i.test(k)) vars[k.toLowerCase()] = str(v, 600);
  const buttonUrl = str(d.buttonUrl, 600);
  return {
    name: str(d.name, 120) || cur.name,
    subject: typeof d.subject === "string" ? str(d.subject, 200) : cur.subject,
    preview: typeof d.preview === "string" ? str(d.preview, 200) || null : cur.preview,
    body: typeof d.body === "string" ? d.body.slice(0, 20000) : cur.body,
    button_label: typeof d.buttonLabel === "string" ? str(d.buttonLabel, 60) || null : cur.button_label,
    button_url: typeof d.buttonUrl === "string" ? (/^https?:\/\//i.test(buttonUrl) || /^\{\{\s*[a-z0-9_]+\s*\}\}$/i.test(buttonUrl) ? buttonUrl : null) : cur.button_url,
    brand: str(d.brand, 60) || cur.brand,
    // From name/address: Babs's account only; a client always sends as their Email sending profile.
    from_name: house ? str(d.fromName, 80) || cur.from_name : cur.from_name,
    from_email: house && typeof d.fromEmail === "string" && FROM_RE.test(d.fromEmail.trim()) ? d.fromEmail.trim().toLowerCase() : cur.from_email,
    tags,
    tag_match: d.tagMatch === "all" ? "all" : d.tagMatch === "any" ? "any" : cur.tag_match,
    skip_prior_template: typeof d.skipPriorTemplate === "boolean" ? d.skipPriorTemplate : cur.skip_prior_template,
    variables: d.variables ? vars : cur.variables,
  };
}

async function load(id: string, request?: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return { denied: a.denied } as const;
  const db = createServerClient();
  const { data } = /^[0-9a-f-]{36}$/i.test(id) ? await db.from("crm_broadcasts").select("*").eq("id", id).eq("master_plan_id", a.planId).maybeSingle() : { data: null };
  if (!data) return { denied: NextResponse.json({ error: "Not found." }, { status: 404 }) } as const;
  return { b: data as BroadcastRow, db, planId: a.planId, a: a as CrmAccount } as const;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if ("denied" in r) return r.denied;
  const { b, db } = r;
  const counts = await sendCounts(db, b.id);
  const reach = b.queued_at ? b.recipient_count : (await listRecipients(db, b)).length;
  const { data: failures } = await db.from("crm_broadcast_sends").select("email, error").eq("broadcast_id", b.id).eq("status", "failed").limit(20);
  return NextResponse.json({ broadcast: b, reach, counts, problems: problems(b), failures: failures ?? [] });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id, request);
  if ("denied" in r) return r.denied;
  const { b, db, a } = r;
  const house = a.house;
  const body = await request.json().catch(() => ({}));
  const draft = (body.draft && typeof body.draft === "object" ? body.draft : {}) as Record<string, unknown>;
  const now = () => new Date().toISOString();

  if (body.action === "save") {
    if (b.status !== "draft" && b.status !== "scheduled") return NextResponse.json({ error: "This one has already gone out, so it can't be edited." }, { status: 400 });
    const next = { ...b, ...fields(draft, b, house) };
    const back = b.status === "scheduled" && problems(next).length ? { status: "draft" as const } : {};
    const { error } = await db.from("crm_broadcasts").update({ ...fields(draft, b, house), ...back, updated_at: now() }).eq("id", b.id).eq("master_plan_id", b.master_plan_id).in("status", ["draft", "scheduled"]);
    if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
    return NextResponse.json({ ok: true, unscheduled: Boolean(back.status) });
  }

  if (body.action === "count") {
    const next = { ...b, ...fields(draft, b, house) };
    return NextResponse.json({ reach: (await listRecipients(db, next)).length });
  }

  if (body.action === "preview") {
    const footer = house ? undefined : footerOf(await senderProfile(b.master_plan_id, db));
    const mail = renderBroadcast({ ...b, ...fields(draft, b, house) } as BroadcastRow, { id: "preview", first_name: "Eloise" }, "", footer);
    return NextResponse.json({ subject: mail.subject, html: mail.html });
  }

  if (body.action === "test") {
    const p = problems(b).filter((x) => !x.startsWith("Pick at least one tag"));
    if (p.length) return NextResponse.json({ error: p.join(" ") }, { status: 400 });
    const profile = await senderProfile(b.master_plan_id, db);
    const who = senderVerdict(profile, true);
    if (!who.ok) return NextResponse.json({ error: who.reason, setup: true }, { status: 400 });
    const to = testRecipient(a, profile.defaults.replyTo);
    if (!to) return NextResponse.json({ error: "There's no email address to send the test to." }, { status: 400 });
    const mail = renderBroadcast(b, { id: "test", first_name: house ? "Babs" : profile.defaults.signoff || null }, "[Test] ", who.house ? undefined : who.footer);
    const s = await sendRendered(who.house ? b : clientFrom(who), to, "test", mail);
    return s.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: s.error || "Couldn't send." }, { status: 500 });
  }

  if (body.action === "schedule" || body.action === "send-now") {
    if (b.status !== "draft" && b.status !== "scheduled") return NextResponse.json({ error: "This one has already gone out." }, { status: 400 });
    const p = problems(b);
    if (p.length) return NextResponse.json({ error: p.join(" ") }, { status: 400 });
    if (!house) {
      const v = senderVerdict(await senderProfile(b.master_plan_id, db), true);
      if (!v.ok) return NextResponse.json({ error: v.reason, setup: true }, { status: 400 });
    }
    if (!(await listRecipients(db, b)).length) return NextResponse.json({ error: "Nobody matches those tags yet." }, { status: 400 });
    let at = new Date();
    const tz = house ? OWNER_TZ : b.timezone || OWNER_TZ;
    if (body.action === "schedule") {
      const when = zonedToUtc(str(body.date, 10), str(body.time, 5), tz);
      if (!when) return NextResponse.json({ error: "Pick a date and time." }, { status: 400 });
      if (when.getTime() < Date.now() - 60_000) return NextResponse.json({ error: "That time has already passed." }, { status: 400 });
      at = when;
    }
    const { error } = await db.from("crm_broadcasts").update({ status: "scheduled", scheduled_at: at.toISOString(), timezone: tz, updated_at: now() }).eq("id", b.id).eq("master_plan_id", b.master_plan_id).in("status", ["draft", "scheduled"]);
    if (error) return NextResponse.json({ error: "Couldn't schedule it." }, { status: 500 });
    if (body.action === "send-now") {
      const sent = await processBroadcast(db, b.id, Date.now() + 45_000).catch((e) => {
        console.error("broadcast send-now:", e);
        return 0;
      });
      return NextResponse.json({ ok: true, sent });
    }
    return NextResponse.json({ ok: true, scheduledAt: at.toISOString() });
  }

  if (body.action === "unschedule") {
    await db.from("crm_broadcasts").update({ status: "draft", scheduled_at: null, updated_at: now() }).eq("id", b.id).eq("master_plan_id", b.master_plan_id).eq("status", "scheduled");
    return NextResponse.json({ ok: true });
  }

  if (body.action === "cancel") {
    // Stops whatever hasn't gone out yet; anyone already sent stays sent.
    await db.from("crm_broadcasts").update({ status: "canceled", finished_at: now(), updated_at: now() }).eq("id", b.id).eq("master_plan_id", b.master_plan_id).in("status", ["scheduled", "sending"]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    if (b.status !== "draft") return NextResponse.json({ error: "Only drafts can be deleted." }, { status: 400 });
    await db.from("crm_broadcasts").delete().eq("id", b.id).eq("master_plan_id", b.master_plan_id).eq("status", "draft");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
