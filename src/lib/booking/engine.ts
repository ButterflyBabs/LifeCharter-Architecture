import { createHash, randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { zonedToUtcISO, dayInTz } from "@/lib/tz";
import { busyFor, createHostEvent, cancelHostEvent, type Busy, type Connection } from "@/lib/booking/connections";
import { createZoomMeeting, deleteZoomMeeting } from "@/lib/zoom";
import { upsertContact, logEvent, EMAIL_RE, type FormField } from "@/lib/crm";
import { enrolContact, isValidTz } from "@/lib/sequences/engine";
import { dealForBooking, moveDeal } from "@/lib/booking/deals";

// The booking engine. A calendar offers a time when at least one of its hosts is
// inside their working hours, clear of every connected calendar (plus buffers),
// clear of their other Suite bookings, and under the daily cap. Round robin
// gives each booking to the free host who has had the fewest recently.

type Db = ReturnType<typeof createServerClient>;

export interface Calendar {
  id: string;
  master_plan_id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_min: number;
  slot_step_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  min_notice_hours: number;
  max_days_ahead: number;
  daily_cap: number | null;
  assignment: "single" | "round_robin";
  host_ids: string[];
  cc_emails: string[];
  location: "zoom" | "phone" | "custom";
  location_detail: string | null;
  questions: FormField[];
  tags: string[];
  sequence_key: string | null;
  confirmation_note: string | null;
  active: boolean;
  create_deal: boolean;
  deal_value: number | null;
  noshow_subject: string | null;
  noshow_body: string | null;
}
export interface Host {
  id: string;
  name: string;
  email: string;
  zoom_email: string | null;
  timezone: string;
  weekly: Record<string, [string, string][]>;
  active: boolean;
}

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const APP = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function calendarBySlug(slug: string, db: Db = createServerClient()): Promise<Calendar | null> {
  const { data } = await db.from("booking_calendars").select("*").eq("slug", slug).maybeSingle();
  return (data as Calendar) ?? null;
}

async function hostsOf(cal: Calendar, db: Db): Promise<Host[]> {
  if (!cal.host_ids.length) return [];
  const { data } = await db.from("booking_hosts").select("*").in("id", cal.host_ids).eq("master_plan_id", cal.master_plan_id).eq("active", true);
  const byId = new Map(((data ?? []) as Host[]).map((h) => [h.id, h]));
  const ordered = cal.host_ids.map((id) => byId.get(id)).filter(Boolean) as Host[];
  return cal.assignment === "single" ? ordered.slice(0, 1) : ordered;
}

// Every busy block for a host between two instants: their calendars + their
// other Suite bookings. A calendar that can't be read blocks the whole range.
async function hostBusy(host: Host, fromISO: string, toISO: string, db: Db): Promise<Busy[]> {
  const [{ data: conns }, { data: booked }] = await Promise.all([
    db.from("booking_connections").select("*").eq("host_id", host.id).eq("check_busy", true),
    db.from("bookings").select("start_at, end_at").eq("host_id", host.id).eq("status", "confirmed").lt("start_at", toISO).gt("end_at", fromISO),
  ]);
  const out: Busy[] = ((booked ?? []) as { start_at: string; end_at: string }[]).map((b) => ({ start: Date.parse(b.start_at), end: Date.parse(b.end_at) }));
  const results = await Promise.all(((conns ?? []) as Connection[]).map((c) => busyFor(c, fromISO, toISO)));
  for (const r of results) {
    if (r === "error") return [{ start: Date.parse(fromISO), end: Date.parse(toISO) }];
    out.push(...r);
  }
  return out;
}

// Candidate start times inside a host's working hours for [from, to).
function workingStarts(host: Host, cal: Calendar, from: number, to: number): number[] {
  const tz = isValidTz(host.timezone) ? host.timezone : "America/Denver";
  const starts: number[] = [];
  const firstDay = dayInTz(new Date(from), tz);
  for (let i = 0; i <= cal.max_days_ahead + 1; i++) {
    const [y, m, d] = firstDay.split("-").map(Number);
    const day = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
    const weekday = DAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];
    for (const [a, b] of host.weekly?.[weekday] ?? []) {
      const winStart = Date.parse(zonedToUtcISO(day, a, tz));
      const winEnd = Date.parse(zonedToUtcISO(day, b, tz));
      for (let s = winStart; s + cal.duration_min * 60_000 <= winEnd; s += cal.slot_step_min * 60_000) {
        if (s >= from && s < to) starts.push(s);
      }
    }
    if (Date.parse(zonedToUtcISO(day, "00:00", tz)) > to) break;
  }
  return starts;
}

export interface SlotPlan {
  slots: { start: string; hostIds: string[] }[];
}

// Open times (UTC ISO) for [fromISO, toISO), capped at the calendar's window.
export async function availableSlots(cal: Calendar, fromISO: string, toISO: string, db: Db = createServerClient()): Promise<SlotPlan> {
  const now = Date.now();
  const from = Math.max(Date.parse(fromISO), now + cal.min_notice_hours * 3_600_000);
  const to = Math.min(Date.parse(toISO), now + cal.max_days_ahead * 86_400_000);
  if (!(to > from)) return { slots: [] };
  const hosts = await hostsOf(cal, db);
  const pad = (cal.buffer_before_min + cal.buffer_after_min + cal.duration_min) * 60_000;
  const rangeFrom = new Date(from - pad).toISOString();
  const rangeTo = new Date(to + pad).toISOString();
  const bySlot = new Map<number, string[]>();

  await Promise.all(
    hosts.map(async (h) => {
      const [busy, { data: mine }] = await Promise.all([
        hostBusy(h, rangeFrom, rangeTo, db),
        db.from("bookings").select("start_at").eq("host_id", h.id).eq("calendar_id", cal.id).eq("status", "confirmed").gte("start_at", rangeFrom).lt("start_at", rangeTo),
      ]);
      const tz = isValidTz(h.timezone) ? h.timezone : "America/Denver";
      const perDay = new Map<string, number>();
      for (const b of (mine ?? []) as { start_at: string }[]) perDay.set(dayInTz(b.start_at, tz), (perDay.get(dayInTz(b.start_at, tz)) ?? 0) + 1);
      for (const s of workingStarts(h, cal, from, to)) {
        const e = s + cal.duration_min * 60_000;
        const lo = s - cal.buffer_before_min * 60_000;
        const hi = e + cal.buffer_after_min * 60_000;
        if (busy.some((b) => b.start < hi && b.end > lo)) continue;
        if (cal.daily_cap && (perDay.get(dayInTz(new Date(s), tz)) ?? 0) >= cal.daily_cap) continue;
        bySlot.set(s, [...(bySlot.get(s) ?? []), h.id]);
      }
    })
  );
  return {
    slots: Array.from(bySlot.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([s, hostIds]) => ({ start: new Date(s).toISOString(), hostIds })),
  };
}

// Round robin: of the hosts free at this time, the one with the fewest bookings
// on this calendar in the last 30 days (ties → the calendar's host order).
async function pickHost(cal: Calendar, free: string[], db: Db): Promise<string[]> {
  if (free.length <= 1) return free;
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await db.from("bookings").select("host_id").eq("calendar_id", cal.id).in("host_id", free).gte("created_at", since).in("status", ["confirmed", "completed", "no_show"]);
  const count = new Map<string, number>();
  for (const b of (data ?? []) as { host_id: string }[]) count.set(b.host_id, (count.get(b.host_id) ?? 0) + 1);
  const order = (id: string) => cal.host_ids.indexOf(id);
  return [...free].sort((a, b) => (count.get(a) ?? 0) - (count.get(b) ?? 0) || order(a) - order(b));
}

export interface BookInput {
  startISO: string;
  name: string;
  email: string;
  phone?: string | null;
  timezone?: string | null;
  answers?: Record<string, string>;
  rescheduleOf?: string | null; // booking id being moved
}

export async function book(cal: Calendar, i: BookInput): Promise<{ ok: true; bookingId: string; manageToken: string } | { ok: false; error: string }> {
  const db = createServerClient();
  const email = i.email.trim().toLowerCase();
  const name = i.name.trim().slice(0, 120);
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  const start = Date.parse(i.startISO);
  if (!Number.isFinite(start)) return { ok: false, error: "Please choose a time." };

  // Re-check the time against live calendars right now.
  const plan = await availableSlots(cal, new Date(start).toISOString(), new Date(start + 60_000).toISOString(), db);
  const slot = plan.slots.find((s) => Date.parse(s.start) === start);
  if (!slot) return { ok: false, error: "That time was just taken. Please choose another." };

  const answers: Record<string, string> = {};
  for (const q of cal.questions ?? []) {
    const v = typeof i.answers?.[q.name] === "string" ? i.answers[q.name].trim().slice(0, q.type === "textarea" ? 3000 : 300) : "";
    if (!v && q.required) return { ok: false, error: `Please answer: ${q.label}` };
    if (v) answers[q.name] = v;
  }

  const token = randomBytes(24).toString("hex");
  const tz = i.timezone && isValidTz(i.timezone) ? i.timezone : "America/Denver";
  const end = start + cal.duration_min * 60_000;
  let bookingId = "";
  let hostId = "";
  // Try each free host in round-robin order; the unique index settles races.
  for (const h of await pickHost(cal, slot.hostIds, db)) {
    const { data, error } = await db
      .from("bookings")
      .insert({
        master_plan_id: cal.master_plan_id,
        calendar_id: cal.id,
        host_id: h,
        start_at: new Date(start).toISOString(),
        end_at: new Date(end).toISOString(),
        invitee_name: name,
        invitee_email: email,
        invitee_phone: i.phone?.trim().slice(0, 40) || null,
        invitee_timezone: tz,
        answers,
        manage_token_hash: hashToken(token),
        rescheduled_from: i.rescheduleOf || null,
      })
      .select("id")
      .single();
    if (!error && data) {
      bookingId = data.id as string;
      hostId = h;
      break;
    }
  }
  if (!bookingId) return { ok: false, error: "That time was just taken. Please choose another." };

  // Everything after this point is best-effort: the booking itself is saved.
  await afterBooking(db, cal, bookingId, hostId, { name, email, phone: i.phone || null, tz, answers, token, start, end, rescheduled: Boolean(i.rescheduleOf), rescheduleOf: i.rescheduleOf || null }).catch((e) => console.error("booking follow-up:", e));
  return { ok: true, bookingId, manageToken: token };
}

async function afterBooking(
  db: Db,
  cal: Calendar,
  bookingId: string,
  hostId: string,
  b: { name: string; email: string; phone: string | null; tz: string; answers: Record<string, string>; token: string; start: number; end: number; rescheduled: boolean; rescheduleOf: string | null }
) {
  const { data: host } = await db.from("booking_hosts").select("*").eq("id", hostId).maybeSingle();
  if (!host) return;
  const startISO = new Date(b.start).toISOString();
  const endISO = new Date(b.end).toISOString();
  const manage = `${APP()}/book/manage/${b.token}`;
  const [first, ...rest] = b.name.split(/\s+/);

  // Meeting place
  let meetingUrl: string | null = null;
  let zoomId: string | null = null;
  if (cal.location === "zoom") {
    const z = await createZoomMeeting({ hostEmail: host.zoom_email || host.email, topic: `${cal.name}: ${b.name}`, startISO, durationMin: cal.duration_min, timezone: host.timezone, agenda: cal.description || "" }).catch(() => null);
    if (z) {
      meetingUrl = z.joinUrl;
      zoomId = z.id;
    }
  }
  const where = cal.location === "zoom" ? meetingUrl || "Zoom (link to follow)" : cal.location === "phone" ? `Phone: ${host.name} will call ${b.phone || "you"}` : cal.location_detail || "";

  // Host's calendar event, with the invitee and anyone copied as guests.
  const { data: conns } = await db.from("booking_connections").select("*").eq("host_id", hostId).order("add_events", { ascending: false }).order("created_at");
  const target = ((conns ?? []) as Connection[]).find((c) => c.add_events) ?? ((conns ?? []) as Connection[])[0];
  const qa = Object.entries(b.answers).map(([k, v]) => `${(cal.questions.find((q) => q.name === k)?.label || k).replace(/_/g, " ")}: ${v}`);
  const description = [`${cal.name} with ${b.name} (${b.email}${b.phone ? `, ${b.phone}` : ""})`, meetingUrl ? `Join: ${meetingUrl}` : "", ...qa, "", `Reschedule or cancel: ${manage}`].filter((x) => x !== undefined).join("\n");
  const guests = [{ email: b.email, name: b.name }, ...cal.cc_emails.filter((e) => e && e.toLowerCase() !== host.email.toLowerCase()).map((e) => ({ email: e }))];
  let hostEvent: Record<string, string> | null = null;
  if (target) {
    const id = await createHostEvent(target, { title: `${cal.name}: ${b.name}`, description, startISO, endISO, location: where, guests });
    if (id) hostEvent = { connection_id: target.id, provider: target.provider, event_id: id };
  }
  await db.from("bookings").update({ meeting_url: meetingUrl, zoom_meeting_id: zoomId, host_event: hostEvent }).eq("id", bookingId);

  // CRM
  const contact = await upsertContact({ masterPlanId: cal.master_plan_id, email: b.email, firstName: first || null, lastName: rest.join(" ") || null, phone: b.phone, timezone: b.tz, source: `booking:${cal.slug}`, tags: [...cal.tags, `booked-${cal.slug}`] }, db);
  if (contact) {
    await db.from("bookings").update({ contact_id: contact.id }).eq("id", bookingId);
    await logEvent(cal.master_plan_id, contact.id, "booking", `${b.rescheduled ? "Rescheduled" : "Booked"} ${cal.name} with ${host.name} for ${fmt(startISO, b.tz)}`, { booking: bookingId, answers: b.answers }, db);
    if (cal.sequence_key && !b.rescheduled) await enrolContact({ masterPlanId: cal.master_plan_id, sequenceKey: cal.sequence_key, email: b.email, source: `booking:${cal.slug}` }).catch(() => {});
  }

  // Pipeline: one deal per person per calendar (a reschedule keeps its deal).
  if (cal.create_deal) {
    let dealId: string | null = null;
    if (b.rescheduleOf) {
      const { data: old } = await db.from("bookings").select("deal_id").eq("id", b.rescheduleOf).maybeSingle();
      dealId = (old?.deal_id as string) ?? null;
      if (dealId) await db.from("pipeline_deals").update({ next_step_due: startISO.slice(0, 10), expected_close: startISO.slice(0, 10), updated_at: new Date().toISOString() }).eq("id", dealId);
    }
    if (!dealId) dealId = await dealForBooking(db, cal, { name: b.name, email: b.email, startISO, answers: b.answers }).catch(() => null);
    if (dealId) await db.from("bookings").update({ deal_id: dealId }).eq("id", bookingId);
  }

  // Emails: the invitee's confirmation; the host and anyone copied get the details.
  await sendMail({
    to: b.email,
    replyTo: host.email,
    fromName: host.name,
    subject: `${b.rescheduled ? "Rescheduled" : "Confirmed"}: ${cal.name} on ${fmt(startISO, b.tz, "short")}`,
    heading: b.rescheduled ? "Your meeting has a new time" : "You're booked",
    lines: [
      `<strong>${esc(cal.name)}</strong> with ${esc(host.name)}`,
      `${esc(fmt(startISO, b.tz))} (${esc(b.tz.replace(/_/g, " "))})`,
      meetingUrl ? `Join on Zoom: <a href="${meetingUrl}">${esc(meetingUrl)}</a>` : esc(where),
      cal.confirmation_note ? esc(cal.confirmation_note) : "",
      "A calendar invitation is on its way too.",
    ],
    button: { label: "Reschedule or cancel", url: manage },
  });
  const hostTo = Array.from(new Set([host.email, ...cal.cc_emails].map((e) => e.toLowerCase())));
  await sendMail({
    to: hostTo,
    replyTo: b.email,
    fromName: "LifeCharter Command Suite",
    subject: `${b.rescheduled ? "Rescheduled" : "New booking"}: ${cal.name} with ${b.name}, ${fmt(startISO, host.timezone, "short")}`,
    heading: `${b.rescheduled ? "Rescheduled" : "New"} ${cal.name}`,
    lines: [
      `<strong>${esc(b.name)}</strong> · <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>${b.phone ? ` · ${esc(b.phone)}` : ""}`,
      `${esc(fmt(startISO, host.timezone))} (${esc(host.timezone.replace(/_/g, " "))}) · host: ${esc(host.name)}`,
      meetingUrl ? `Zoom: <a href="${meetingUrl}">${esc(meetingUrl)}</a>` : esc(where),
      ...qa.map(esc),
    ],
    button: { label: "Open Calendars in the Suite", url: `${APP()}/calendars` },
  });
}

export async function cancelBooking(bookingId: string, reason: string, by: "invitee" | "owner", opts: { notify?: boolean; status?: "canceled" | "rescheduled" } = {}): Promise<boolean> {
  const db = createServerClient();
  const { data: b } = await db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!b || b.status !== "confirmed") return false;
  const status = opts.status ?? "canceled";
  await db.from("bookings").update({ status, cancel_reason: reason.slice(0, 500) || null, canceled_at: new Date().toISOString() }).eq("id", bookingId);
  const he = b.host_event as { connection_id: string; event_id: string } | null;
  if (he?.connection_id) {
    const { data: c } = await db.from("booking_connections").select("*").eq("id", he.connection_id).maybeSingle();
    if (c) await cancelHostEvent(c as Connection, he.event_id);
  }
  if (b.zoom_meeting_id) await deleteZoomMeeting(b.zoom_meeting_id);
  const [{ data: cal }, { data: host }] = await Promise.all([
    db.from("booking_calendars").select("*").eq("id", b.calendar_id).maybeSingle(),
    db.from("booking_hosts").select("*").eq("id", b.host_id).maybeSingle(),
  ]);
  if (b.deal_id && status === "canceled") await moveDeal(db, b.master_plan_id, b.deal_id, "lost", `Canceled ${cal?.name ?? "meeting"}${reason ? `: ${reason}` : ""}`).catch(() => {});
  if (b.contact_id && cal && status === "canceled") await logEvent(b.master_plan_id, b.contact_id, "booking", `Canceled ${cal.name} (${by === "invitee" ? "by them" : "by you"})${reason ? `: ${reason}` : ""}`, { booking: bookingId }, db);
  if (opts.notify !== false && cal && host && status === "canceled") {
    const tz = b.invitee_timezone || host.timezone;
    await sendMail({
      to: b.invitee_email,
      replyTo: host.email,
      fromName: host.name,
      subject: `Canceled: ${cal.name} on ${fmt(b.start_at, tz, "short")}`,
      heading: "Your meeting is canceled",
      lines: [`${esc(cal.name)} with ${esc(host.name)}, ${esc(fmt(b.start_at, tz))}, has been canceled.`, reason ? `Note: ${esc(reason)}` : ""],
      button: { label: "Book a new time", url: `${APP()}/book/${cal.slug}` },
    });
    await sendMail({
      to: Array.from(new Set([host.email, ...(cal.cc_emails as string[])].map((e: string) => e.toLowerCase()))),
      replyTo: b.invitee_email,
      fromName: "LifeCharter Command Suite",
      subject: `Canceled: ${cal.name} with ${b.invitee_name}, ${fmt(b.start_at, host.timezone, "short")}`,
      heading: `${cal.name} canceled`,
      lines: [`${esc(b.invitee_name)} (${esc(b.invitee_email)}) · ${esc(fmt(b.start_at, host.timezone))}`, `Canceled ${by === "invitee" ? "by them" : "by you"}${reason ? `: ${esc(reason)}` : ""}`],
    });
  }
  return true;
}

// Cron: 24-hour and 1-hour reminders to the invitee.
export async function sendReminders(): Promise<number> {
  const db = createServerClient();
  const now = Date.now();
  const { data } = await db
    .from("bookings")
    .select("*, booking_calendars(name, slug), booking_hosts(name, email)")
    .eq("status", "confirmed")
    .gt("start_at", new Date(now).toISOString())
    .lt("start_at", new Date(now + 24 * 3_600_000 + 10 * 60_000).toISOString())
    .limit(500);
  let sent = 0;
  for (const b of data ?? []) {
    const left = Date.parse(b.start_at) - now;
    const r = (b.reminders ?? {}) as Record<string, string>;
    const which = left <= 70 * 60_000 ? "r1" : left <= 24 * 3_600_000 + 10 * 60_000 && left > 3 * 3_600_000 ? "r24" : null;
    if (!which || r[which]) continue;
    // Claim first so two cron runs never double-send.
    const { data: claimed } = await db.from("bookings").update({ reminders: { ...r, [which]: new Date().toISOString() } }).eq("id", b.id).is(`reminders->>${which}`, null).select("id");
    if (!claimed?.length) continue;
    const cal = b.booking_calendars as { name: string; slug: string };
    const host = b.booking_hosts as { name: string; email: string };
    const tz = b.invitee_timezone || "America/Denver";
    await sendMail({
      to: b.invitee_email,
      replyTo: host?.email,
      fromName: host?.name || "LifeCharter Command Suite",
      subject: `${which === "r1" ? "In 1 hour" : "Tomorrow"}: ${cal.name} with ${host?.name}`,
      heading: which === "r1" ? "See you soon" : "A reminder for tomorrow",
      lines: [`<strong>${esc(cal.name)}</strong> with ${esc(host?.name || "")}`, esc(fmt(b.start_at, tz)), b.meeting_url ? `Join on Zoom: <a href="${b.meeting_url}">${esc(b.meeting_url)}</a>` : ""],
    });
    sent++;
  }
  return sent;
}

// ── Mail + formatting ────────────────────────────────────────────────────────
function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
export function fmt(iso: string, tz: string, style: "long" | "short" = "long") {
  const d = new Date(iso);
  return style === "short"
    ? d.toLocaleString("en-US", { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : d.toLocaleString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

async function sendMail(m: { to: string | string[]; replyTo?: string; fromName: string; subject: string; heading: string; lines: string[]; button?: { label: string; url: string } }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const body = m.lines.filter(Boolean).map((l) => `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${l}</p>`).join("");
  const button = m.button
    ? `<p style="margin:18px 0 6px"><a href="${m.button.url}" style="display:inline-block;background:#2E7C83;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:11px 22px;border-radius:999px">${esc(m.button.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#FBF8F1"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;padding:28px;border:1px solid #EADFCF"><tr><td><h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:22px;color:#0F5B63">${esc(m.heading)}</h1>${body}${button}<p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#9aa3ad">Questions? Reply to this email or write to support@amilynnecarroll.com.</p></td></tr></table></td></tr></table></body></html>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${m.fromName.replace(/[<>"]/g, "")} <reminders@lccommandsuite.com>`, to: m.to, reply_to: m.replyTo, subject: m.subject, html }),
  }).catch((e) => console.error("booking mail:", e));
}

// The host marked a meeting as missed: the deal is lost for now (it reopens if
// they book again) and, if the calendar has a follow-up written, it goes out.
export async function markNoShow(bookingId: string): Promise<void> {
  const db = createServerClient();
  const { data: b } = await db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!b) return;
  const [{ data: cal }, { data: host }] = await Promise.all([
    db.from("booking_calendars").select("*").eq("id", b.calendar_id).maybeSingle(),
    db.from("booking_hosts").select("*").eq("id", b.host_id).maybeSingle(),
  ]);
  if (b.deal_id) await moveDeal(db, b.master_plan_id, b.deal_id, "lost", `Missed ${cal?.name ?? "meeting"}.`).catch(() => {});
  if (!cal?.noshow_body || !host) return;
  const first = String(b.invitee_name || "").split(/\s+/)[0] || "there";
  const fill = (t: string) => t.replace(/\{\{\s*first_name\s*\}\}/gi, first).replace(/\{\{\s*host\s*\}\}/gi, host.name).replace(/\{\{\s*meeting\s*\}\}/gi, cal.name);
  const paras = fill(cal.noshow_body).split(/\n{2,}/).map((p: string) => esc(p).replace(/\n/g, "<br>"));
  await sendMail({
    to: b.invitee_email,
    replyTo: host.email,
    fromName: host.name,
    subject: fill(cal.noshow_subject || "We missed you"),
    heading: fill(cal.noshow_subject || "We missed you"),
    lines: paras,
    button: { label: "Choose a new time", url: `${APP()}/book/${cal.slug}` },
  });
  if (b.contact_id) await logEvent(b.master_plan_id, b.contact_id, "email", `Sent the missed-meeting follow-up for ${cal.name}`, {}, db);
}
