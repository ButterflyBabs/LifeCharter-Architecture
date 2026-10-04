import { createServerClient } from "@/lib/supabase/server";
import { renderStep } from "@/lib/sequences/render";
import { sendRendered } from "@/lib/sequences/engine";
import { logEvent } from "@/lib/crm";
import type { ZoomOccurrence, ZoomRegistrant, ZoomSchedule } from "@/lib/zoom";

// The Suite's own confirmation + reminder emails for the two Zoom events,
// replacing Global Control's workflows one event at a time.
//
// Cut-over (per event, app_settings key `event_emails:<event_key>`):
//   off → the registrant sync fires the Global Control tag exactly as before.
//   on  → registrants first seen after the switch get NO Global Control tag;
//         their sync row is marked suite_emails=true and they get these emails.
// Anyone synced before the switch stays with Global Control for good, and a
// sync row whose gc_tag_status is 'tagged' never receives a Suite email.
//
// Every send is claimed in event_email_sends first (unique per registrant,
// kind and occurrence), so nothing is ever sent twice.

type Db = ReturnType<typeof createServerClient>;

export const EVENT_KEYS = ["masterclass", "incubator"] as const;
export type EventKey = (typeof EVENT_KEYS)[number];
export const EMAIL_KINDS = ["confirm", "day_before", "hour_before"] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

export const EVENT_SENDERS: Record<EventKey, { from_name: string; from_email: string; reply_to: string; brand: string; title: string }> = {
  masterclass: { from_name: "AmiLynne Carroll", from_email: "hello@lccommandsuite.com", reply_to: "support@lccommandsuite.com", brand: "The Command Shift MasterClass", title: "Command Shift MasterClass" },
  incubator: { from_name: "AmiLynne Carroll", from_email: "hello@lifecharter.life", reply_to: "support@lccommandsuite.com", brand: "LifeCharter Incubator", title: "LifeCharter Incubator" },
};

const KIND_LABEL: Record<EmailKind, string> = { confirm: "confirmation", day_before: "day-before reminder", hour_before: "hour-before reminder" };

export const isEventKey = (k: unknown): k is EventKey => typeof k === "string" && (EVENT_KEYS as readonly string[]).includes(k);
export const isEmailKind = (k: unknown): k is EmailKind => typeof k === "string" && (EMAIL_KINDS as readonly string[]).includes(k);

export interface EventTemplate {
  id: string;
  event_key: EventKey;
  kind: EmailKind;
  subject: string;
  preview: string | null;
  body: string;
  button_label: string | null;
  active: boolean;
  updated_at: string | null;
}

export interface EventSetting {
  suite_emails_on: boolean;
  switched_on_at: string | null;
}

// ── Settings (app_settings: key `event_emails:<event>`, value JSON text) ─────

export const settingKey = (ev: EventKey) => `event_emails:${ev}`;

export async function eventSetting(db: Db, ev: EventKey): Promise<EventSetting> {
  const off: EventSetting = { suite_emails_on: false, switched_on_at: null };
  const { data } = await db.from("app_settings").select("value").eq("key", settingKey(ev)).maybeSingle();
  if (!data?.value) return off;
  try {
    const v = (typeof data.value === "string" ? JSON.parse(data.value) : data.value) as Partial<EventSetting>;
    return { suite_emails_on: v?.suite_emails_on === true, switched_on_at: typeof v?.switched_on_at === "string" ? v.switched_on_at : null };
  } catch {
    return off;
  }
}

export async function eventTemplates(db: Db, ev?: EventKey): Promise<EventTemplate[]> {
  let q = db.from("event_email_templates").select("id, event_key, kind, subject, preview, body, button_label, active, updated_at");
  if (ev) q = q.eq("event_key", ev);
  const { data } = await q;
  return (data ?? []) as EventTemplate[];
}

// Suite emails take over from Global Control only when the switch is on (and
// its time has come) AND the confirmation template is live — so a registrant
// can never land in the gap where neither system emails them.
export function suiteEmailsLive(setting: EventSetting, templates: EventTemplate[], now = new Date()): boolean {
  if (!setting.suite_emails_on) return false;
  if (setting.switched_on_at && new Date(setting.switched_on_at).getTime() > now.getTime()) return false;
  return templates.some((t) => t.kind === "confirm" && t.active);
}

// ── Merge fields ─────────────────────────────────────────────────────────────

function timeIn(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
    .format(d)
    .replace(/\s?AM$/i, " am")
    .replace(/\s?PM$/i, " pm");
}

/** "Thursday, October 8 at 12:00 pm MT / 2:00 pm ET" */
export function formatEventDateTime(startIso: string): string {
  const d = new Date(startIso);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", weekday: "long", month: "long", day: "numeric" }).format(d);
  return `${day} at ${timeIn(d, "America/Denver")} MT / ${timeIn(d, "America/New_York")} ET`;
}

// Fills the event-only field; renderStep then fills {{first_name}} / {{greeting}}.
const fillEvent = (s: string | null | undefined, when: string) => (s ?? "").replace(/\{\{\s*event_date_time\s*\}\}/gi, when);

export function renderEventEmail(o: { event: EventKey; template: Pick<EventTemplate, "subject" | "preview" | "body" | "button_label">; occurrenceStart: string; joinUrl: string; contact: { id: string; first_name: string | null } }) {
  const when = formatEventDateTime(o.occurrenceStart);
  const t = o.template;
  return renderStep({
    brand: EVENT_SENDERS[o.event].brand,
    subject: fillEvent(t.subject, when),
    preview: fillEvent(t.preview, when),
    body: fillEvent(t.body, when),
    buttonLabel: t.button_label ? fillEvent(t.button_label, when) : null,
    buttonUrl: o.joinUrl || null,
    contact: o.contact,
  });
}

// ── The occurrence a registrant signed up for ────────────────────────────────
// A recurring meeting lets one registration attend any occurrence. Reminders go
// for the first occurrence still ahead when they registered — not every month
// forever. Returns it only while it hasn't ended; otherwise null.
export function registrantOccurrence(schedule: ZoomSchedule, registeredAt: string | null, now = new Date()): ZoomOccurrence | null {
  const reg = registeredAt ? new Date(registeredAt).getTime() : now.getTime();
  const end = (o: ZoomOccurrence) => new Date(o.start).getTime() + o.duration * 60_000;
  const theirs = schedule.occurrences.find((o) => end(o) > reg) ?? null;
  if (!theirs || end(theirs) <= now.getTime()) return null;
  return theirs;
}

// ── Timing windows ───────────────────────────────────────────────────────────
const H = 3600_000;
const M = 60_000;
export function dueKinds(startIso: string, now = new Date()): EmailKind[] {
  const start = new Date(startIso).getTime();
  const t = now.getTime();
  const out: EmailKind[] = ["confirm"];
  if (t >= start - 24 * H && t < start - 2 * H) out.push("day_before");
  if (t >= start - 60 * M && t < start + 10 * M) out.push("hour_before");
  return out;
}

// ── Claim-before-send ────────────────────────────────────────────────────────
// Inserting the ledger row IS the claim: the unique (registrant, kind,
// occurrence) key means a second run (or a concurrent one) gets 23505 and backs off.
async function claim(db: Db, row: { zoom_registrant_id: string; event_key: EventKey; kind: EmailKind; occurrence_start: string | null; contact_id: string | null; email: string; status: "claimed" | "skipped"; error?: string }): Promise<string | null> {
  const { data, error } = await db.from("event_email_sends").insert(row).select("id").maybeSingle();
  if (error) {
    if (error.code !== "23505") console.error("[event-emails] claim failed:", error.message);
    return null;
  }
  return (data?.id as string) ?? null;
}

interface SyncRow {
  zoom_registrant_id: string;
  email: string;
  gc_tag_status: string | null;
  suite_emails: boolean | null;
  registered_at: string | null;
  synced_at: string | null;
}

export interface SendSummary {
  eligible: number;
  sent: Partial<Record<EmailKind, number>>;
  skipped: number;
  failed: number;
  note?: string;
}

// Sends whatever is due for one event's current (approved) registrants.
export async function sendDueEventEmails(o: {
  db: Db;
  event: EventKey;
  meetingId: string;
  registrants: ZoomRegistrant[];
  housePlan: string | null;
  schedule: () => Promise<ZoomSchedule>;
  templates: EventTemplate[];
  now?: Date;
}): Promise<SendSummary> {
  const { db, event } = o;
  const now = o.now ?? new Date();
  const summary: SendSummary = { eligible: 0, sent: {}, skipped: 0, failed: 0 };
  if (!o.housePlan) return { ...summary, note: "no house account" };
  const live = new Map(o.templates.filter((t) => t.active).map((t) => [t.kind, t]));
  if (!live.size || !o.registrants.length) return summary;

  const byId = new Map(o.registrants.map((r) => [r.id, r]));
  const { data: rows } = await db
    .from("zoom_registrant_syncs")
    .select("zoom_registrant_id, email, gc_tag_status, suite_emails, registered_at, synced_at")
    .eq("suite_emails", true)
    .in("zoom_registrant_id", Array.from(byId.keys()));
  // Belt and braces: someone Global Control already tagged never gets a Suite email.
  const mine = ((rows ?? []) as SyncRow[]).filter((r) => r.suite_emails === true && r.gc_tag_status !== "tagged");
  if (!mine.length) return summary;

  let schedule: ZoomSchedule;
  try {
    schedule = await o.schedule();
  } catch (err) {
    console.error(`[event-emails] ${event}: Zoom schedule fetch failed:`, err);
    return { ...summary, note: "Zoom schedule fetch failed" };
  }

  const emails = Array.from(new Set(mine.map((r) => r.email.trim().toLowerCase())));
  const [{ data: contacts }, { data: prior }] = await Promise.all([
    db.from("seq_contacts").select("id, email, first_name, unsubscribed_at").eq("master_plan_id", o.housePlan).in("email", emails),
    db.from("event_email_sends").select("zoom_registrant_id, kind, occurrence_start, status, sent_at").eq("event_key", event).in("zoom_registrant_id", mine.map((r) => r.zoom_registrant_id)),
  ]);
  const contactByEmail = new Map(((contacts ?? []) as { id: string; email: string; first_name: string | null; unsubscribed_at: string | null }[]).map((c) => [c.email.toLowerCase(), c]));
  const priorRows = (prior ?? []) as { zoom_registrant_id: string; kind: EmailKind; occurrence_start: string | null; status: string; sent_at: string | null }[];
  const sameTime = (a: string | null, b: string | null) => (a && b ? new Date(a).getTime() === new Date(b).getTime() : a === b);
  const done = (id: string, kind: EmailKind, occ: string | null) => priorRows.some((p) => p.zoom_registrant_id === id && p.kind === kind && sameTime(p.occurrence_start, occ));
  const confirmSentAt = new Map<string, number>();
  for (const p of priorRows) if (p.kind === "confirm" && p.status === "sent" && p.sent_at) confirmSentAt.set(p.zoom_registrant_id, new Date(p.sent_at).getTime());

  const sender = EVENT_SENDERS[event];
  for (const row of mine) {
    const reg = byId.get(row.zoom_registrant_id);
    const contact = contactByEmail.get(row.email.trim().toLowerCase());
    if (!reg || !contact) continue;
    const occ = registrantOccurrence(schedule, row.registered_at || reg.createTime || row.synced_at, now);
    if (!occ) continue; // their session has ended
    summary.eligible++;

    for (const kind of dueKinds(occ.start, now)) {
      const tpl = live.get(kind);
      if (!tpl) continue; // not live: nothing claimed, nothing sent
      const occKey = kind === "confirm" ? null : occ.start;
      if (done(reg.id, kind, occKey)) continue;
      const base = { zoom_registrant_id: reg.id, event_key: event, kind, occurrence_start: occKey, contact_id: contact.id, email: contact.email };

      // Unsubscribed, or a reminder landing right on top of the confirmation: record 'skipped' so it's final.
      const confirmedAgo = confirmSentAt.has(reg.id) ? now.getTime() - confirmSentAt.get(reg.id)! : Infinity;
      const skipReason = contact.unsubscribed_at
        ? "unsubscribed"
        : kind === "day_before" && confirmedAgo < 6 * H
          ? "confirmation sent within 6 hours"
          : kind === "hour_before" && confirmedAgo < 20 * M
            ? "confirmation sent within 20 minutes"
            : null;
      if (skipReason) {
        if (await claim(db, { ...base, status: "skipped", error: skipReason })) summary.skipped++;
        continue;
      }

      const id = await claim(db, { ...base, status: "claimed" });
      if (!id) continue; // another run has it
      const mail = renderEventEmail({ event, template: tpl, occurrenceStart: occ.start, joinUrl: reg.joinUrl, contact: { id: contact.id, first_name: contact.first_name || reg.firstName || null } });
      const r = await sendRendered(sender, contact.email, contact.id, mail);
      const sentAt = new Date().toISOString();
      await db
        .from("event_email_sends")
        .update(r.ok ? { status: "sent", resend_id: r.id ?? null, sent_at: sentAt } : { status: "failed", error: (r.error || "").slice(0, 500) })
        .eq("id", id);
      if (r.ok) {
        summary.sent[kind] = (summary.sent[kind] ?? 0) + 1;
        if (kind === "confirm") confirmSentAt.set(reg.id, new Date(sentAt).getTime());
        await logEvent(o.housePlan, contact.id, "email", `${sender.title} ${KIND_LABEL[kind]}: “${mail.subject}”`, { event, kind, occurrence: occ.start, resendId: r.id ?? null }, db).catch(() => {});
      } else {
        summary.failed++;
      }
    }
  }
  return summary;
}
