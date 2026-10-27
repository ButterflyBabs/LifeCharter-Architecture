import { isAwayOn } from "@/lib/awayMode";
import { DEFAULT_1H, DEFAULT_24H, fillReminder, inQuietHours } from "@/lib/sms";
import { sendSms } from "@/lib/smsServer";
import { createHash, randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { zonedToUtcISO, dayInTz } from "@/lib/tz";
import { busyFor, createHostEvent, cancelHostEvent, type Busy, type Connection } from "@/lib/booking/connections";
import { createZoomMeeting, deleteZoomMeeting } from "@/lib/zoom";
import { c2cOnBooking, c2cOnOutcome } from "@/lib/c2c";
import { upsertContact, logEvent, EMAIL_RE, type FormField } from "@/lib/crm";
import { enrolContact, isValidTz } from "@/lib/sequences/engine";
import { dealForBooking, moveDeal } from "@/lib/booking/deals";
import { accountSender, senderCache, type AccountSender } from "@/lib/email/accountSender";
import { inviteToLaunchCall } from "@/lib/launchCallInvite";

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
  require_phone?: boolean;
  pay_mode?: "none" | "full" | "deposit";
  price?: number | null;
  deposit?: number | null;
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
    db.from("bookings").select("start_at, end_at").eq("host_id", host.id).in("status", ["confirmed", "pending_payment"]).lt("start_at", toISO).gt("end_at", fromISO),
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
  await releaseExpiredHolds(db).catch(() => null);
  const now = Date.now();
  const from = Math.max(Date.parse(fromISO), now + cal.min_notice_hours * 3_600_000);
  const to = Math.min(Date.parse(toISO), now + cal.max_days_ahead * 86_400_000);
  if (!(to > from)) return { slots: [] };
  const [hosts, { data: awayRow }] = await Promise.all([hostsOf(cal, db), db.from("away_mode").select("starts_on, ends_on, block_bookings").eq("master_plan_id", cal.master_plan_id).maybeSingle()]);
  // Out-of-office (task 1155): no times on the owner's away dates.
  const away = awayRow?.block_bookings ? (awayRow as { starts_on: string; ends_on: string }) : null;
  const pad = (cal.buffer_before_min + cal.buffer_after_min + cal.duration_min) * 60_000;
  const rangeFrom = new Date(from - pad).toISOString();
  const rangeTo = new Date(to + pad).toISOString();
  const bySlot = new Map<number, string[]>();

  await Promise.all(
    hosts.map(async (h) => {
      const [busy, { data: mine }] = await Promise.all([
        hostBusy(h, rangeFrom, rangeTo, db),
        db.from("bookings").select("start_at").eq("host_id", h.id).eq("calendar_id", cal.id).in("status", ["confirmed", "pending_payment"]).gte("start_at", rangeFrom).lt("start_at", rangeTo),
      ]);
      const tz = isValidTz(h.timezone) ? h.timezone : "America/Denver";
      const perDay = new Map<string, number>();
      for (const b of (mine ?? []) as { start_at: string }[]) perDay.set(dayInTz(b.start_at, tz), (perDay.get(dayInTz(b.start_at, tz)) ?? 0) + 1);
      for (const s of workingStarts(h, cal, from, to)) {
        const e = s + cal.duration_min * 60_000;
        const lo = s - cal.buffer_before_min * 60_000;
        const hi = e + cal.buffer_after_min * 60_000;
        if (busy.some((b) => b.start < hi && b.end > lo)) continue;
        if (away && isAwayOn(away, dayInTz(new Date(s), tz))) continue;
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
  hold?: { amount: number } | null; // paid booking: hold the time unpaid for HOLD_MINUTES; confirmPaidBooking finishes it
}

/** How long an unpaid time is held while the person pays (Stripe Checkout's shortest expiry is 30 minutes). */
export const HOLD_MINUTES = 30;

/** What a calendar asks for at booking: nothing, the full price, or a deposit (in cents). */
export function bookingCharge(cal: Pick<Calendar, "pay_mode" | "price" | "deposit">): { cents: number; kind: "full" | "deposit" } | null {
  const mode = cal.pay_mode ?? "none";
  const amount = mode === "full" ? Number(cal.price) : mode === "deposit" ? Number(cal.deposit) : 0;
  const cents = Math.round((Number.isFinite(amount) ? amount : 0) * 100);
  if (mode === "none" || cents < 50) return null;
  return { cents, kind: mode };
}

// Unpaid holds past their time go back on the calendar (no emails: nothing was ever confirmed).
async function releaseExpiredHolds(db: Db) {
  await db.from("bookings").update({ status: "canceled", cancel_reason: "Payment not completed", canceled_at: new Date().toISOString(), pending_token: null }).eq("status", "pending_payment").lt("pay_expires_at", new Date().toISOString());
}

export async function book(cal: Calendar, i: BookInput): Promise<{ ok: true; bookingId: string; manageToken: string } | { ok: false; error: string }> {
  const db = createServerClient();
  const email = i.email.trim().toLowerCase();
  const name = i.name.trim().slice(0, 120);
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  const start = Date.parse(i.startISO);
  if (!Number.isFinite(start)) return { ok: false, error: "Please choose a time." };
  if (cal.require_phone && (i.phone || "").replace(/\D/g, "").length < 7) return { ok: false, error: "Please enter a phone number." };

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
        ...(i.hold
          ? { status: "pending_payment", pay_amount: i.hold.amount, pay_expires_at: new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString(), pending_token: token }
          : {}),
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
  if (i.hold) return { ok: true, bookingId, manageToken: token }; // confirmed (and followed up) once Stripe says it's paid
  if (i.rescheduleOf) {
    // A paid booking that moves keeps its payment (no second charge).
    const { data: old } = await db.from("bookings").select("pay_amount, paid_amount, pay_session_id, sms_ok").eq("id", i.rescheduleOf).maybeSingle();
    if (old?.paid_amount) await db.from("bookings").update({ pay_amount: old.pay_amount, paid_amount: old.paid_amount, pay_session_id: old.pay_session_id }).eq("id", bookingId);
    if (old?.sms_ok) await db.from("bookings").update({ sms_ok: true }).eq("id", bookingId); // text reminders follow a moved booking
  }

  // Everything after this point is best-effort: the booking itself is saved.
  await afterBooking(db, cal, bookingId, hostId, { name, email, phone: i.phone || null, tz, answers, token, start, end, rescheduled: Boolean(i.rescheduleOf), rescheduleOf: i.rescheduleOf || null }).catch((e) => console.error("booking follow-up:", e));
  return { ok: true, bookingId, manageToken: token };
}

/**
 * Stripe says a held booking is paid: confirm it and run everything a free booking runs (meeting link, calendar
 * event, contact, deal, emails). If the hold had already been released and the time is still free, it is taken back;
 * if someone else took it meanwhile, the booking stays canceled and the owner is told to refund or rebook.
 */
export async function confirmPaidBooking(bookingId: string, paidCents: number, sessionId: string): Promise<"confirmed" | "already" | "lost" | "missing"> {
  const db = createServerClient();
  const { data: b } = await db.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!b) return "missing";
  if (b.status === "confirmed" || b.status === "completed") return "already";
  const { error } = await db
    .from("bookings")
    .update({ status: "confirmed", paid_amount: paidCents / 100, pay_session_id: sessionId, pending_token: null, cancel_reason: null, canceled_at: null })
    .eq("id", bookingId)
    .in("status", ["pending_payment", "canceled"]);
  const { data: cal } = await db.from("booking_calendars").select("*").eq("id", b.calendar_id).maybeSingle();
  if (error) {
    // The slot went to someone else after the hold ran out.
    await db.from("bookings").update({ paid_amount: paidCents / 100, pay_session_id: sessionId, cancel_reason: "Paid after the hold ran out; the time was taken. Refund or rebook." }).eq("id", bookingId);
    const { data: host } = await db.from("booking_hosts").select("name, email, timezone").eq("id", b.host_id).maybeSingle();
    if (host && cal) {
      const who = await accountSender(cal.master_plan_id, { marketing: false }, db);
      await sendMail(who, {
        to: host.email,
        fromName: "Bookings",
        subject: `Action needed: ${b.invitee_name} paid but their time was taken`,
        heading: "A payment needs your attention",
        lines: [`${b.invitee_name} (${b.invitee_email}) paid $${(paidCents / 100).toFixed(2)} for ${cal.name} at ${fmt(b.start_at, host.timezone || "America/Denver")}, but finished paying after the 30-minute hold and the time was booked by someone else.`, "Please reach out to rebook them, or refund the payment in your Stripe account."],
      }).catch(() => null);
    }
    return "lost";
  }
  if (cal && b.pending_token) {
    await afterBooking(db, cal as Calendar, bookingId, b.host_id, {
      name: b.invitee_name, email: b.invitee_email, phone: b.invitee_phone, tz: b.invitee_timezone || "America/Denver", answers: (b.answers as Record<string, string>) ?? {},
      token: b.pending_token, start: Date.parse(b.start_at), end: Date.parse(b.end_at), rescheduled: false, rescheduleOf: null, paid: paidCents / 100,
    }).catch((e) => console.error("paid booking follow-up:", e));
  }
  return "confirmed";
}

/** Checkout expired or was abandoned: put the time back (nothing was confirmed, so no emails). */
export async function releaseHold(bookingId: string): Promise<void> {
  await createServerClient().from("bookings").update({ status: "canceled", cancel_reason: "Payment not completed", canceled_at: new Date().toISOString(), pending_token: null }).eq("id", bookingId).eq("status", "pending_payment");
}

async function afterBooking(
  db: Db,
  cal: Calendar,
  bookingId: string,
  hostId: string,
  b: { name: string; email: string; phone: string | null; tz: string; answers: Record<string, string>; token: string; start: number; end: number; rescheduled: boolean; rescheduleOf: string | null; paid?: number | null }
) {
  const { data: host } = await db.from("booking_hosts").select("*").eq("id", hostId).eq("master_plan_id", cal.master_plan_id).maybeSingle();
  if (!host) return;
  // Who this account's booking emails come from (Babs: as always; a client: only their own verified domain, else none).
  const who = await accountSender(cal.master_plan_id, { marketing: false }, db);
  const startISO = new Date(b.start).toISOString();
  const endISO = new Date(b.end).toISOString();
  const manage = `${APP()}/book/manage/${b.token}`;
  const [first, ...rest] = b.name.split(/\s+/);

  // Meeting place
  let meetingUrl: string | null = null;
  let zoomId: string | null = null;
  // The Suite's Zoom app belongs to Babs's Zoom account, so only her calendars create Zoom meetings.
  if (cal.location === "zoom" && who.house) {
    const mk = (hostEmail: string, joinBeforeHost: boolean) =>
      createZoomMeeting({ hostEmail, topic: `${cal.name}: ${b.name}`, startISO, durationMin: cal.duration_min, timezone: host.timezone, agenda: cal.description || "", joinBeforeHost }).catch(() => null);
    // The host's own Zoom login when they have one; otherwise (a team member with no Zoom seat, such as Marcello)
    // the meeting is created under the account's own Zoom user, and people may join before the host so the
    // team member can simply open the join link and start the call.
    let z = host.zoom_email ? await mk(host.zoom_email, false) : null;
    if (!z) {
      if (!host.zoom_email) z = await mk(host.email, false); // they may already be a Zoom user under their sign-in email
      if (!z) {
        const { data: owner } = await db.from("booking_hosts").select("zoom_email").eq("master_plan_id", cal.master_plan_id).not("zoom_email", "is", null).neq("id", hostId).limit(1).maybeSingle();
        const fallback = (owner?.zoom_email as string | null) || "";
        if (fallback) z = await mk(fallback, true);
      }
    }
    if (z) {
      meetingUrl = z.joinUrl;
      zoomId = z.id;
    }
  }
  const where = cal.location === "zoom" ? meetingUrl || (who.house ? "Zoom (link to follow)" : cal.location_detail || "Video call (link to follow)") : cal.location === "phone" ? `Phone: ${host.name} will call ${b.phone || "you"}` : cal.location_detail || "";

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
  const contact = await upsertContact({ masterPlanId: cal.master_plan_id, email: b.email, firstName: first || null, lastName: rest.join(" ") || null, phone: b.phone, company: b.answers.business || b.answers.business_name || b.answers.company || undefined, timezone: b.tz, source: `booking:${cal.slug}`, tags: [...cal.tags, `booked-${cal.slug}`] }, db);
  if (contact) {
    await db.from("bookings").update({ contact_id: contact.id }).eq("id", bookingId);
    await logEvent(cal.master_plan_id, contact.id, "booking", `${b.rescheduled ? "Rescheduled" : "Booked"} ${cal.name} with ${host.name} for ${fmt(startISO, b.tz)}`, { booking: bookingId, answers: b.answers }, db);
    if (cal.sequence_key && !b.rescheduled) await enrolContact({ masterPlanId: cal.master_plan_id, sequenceKey: cal.sequence_key, email: b.email, source: `booking:${cal.slug}` }).catch(() => {});
  }

  // A consultant's discovery call (Call to Close): their pipeline card takes the booking (and the CRM contact it just made).
  await c2cOnBooking(db, cal.master_plan_id, {
    hostEmail: host.email, contactId: contact?.id ?? null, bookingId, name: b.name, email: b.email, phone: b.phone,
    business: b.answers.business || b.answers.business_name || b.answers.company || null, startISO, tz: b.tz,
  }).catch((e) => console.error("call to close card:", e));

  // New clients who book their 1:1 Welcome Call (Executive Consultation or self-serve Starter) are invited to the next New
  // Client Launch Call: date, Zoom link and a calendar file in their own email (see lib/launchCallInvite).
  if (cal.slug === "new-client-welcome-call" && !b.rescheduled && who.house) {
    await inviteToLaunchCall({ masterPlanId: cal.master_plan_id, contactId: contact?.id ?? null, name: b.name, email: b.email, after: new Date(b.start) });
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
  await sendMail(who, {
    to: b.email,
    replyTo: host.email,
    fromName: host.name,
    subject: `${b.rescheduled ? "Rescheduled" : "Confirmed"}: ${cal.name} on ${fmt(startISO, b.tz, "short")}`,
    heading: b.rescheduled ? "Your meeting has a new time" : "You're booked",
    lines: [
      `<strong>${esc(cal.name)}</strong> with ${esc(host.name)}`,
      `${esc(fmt(startISO, b.tz))} (${esc(b.tz.replace(/_/g, " "))})`,
      meetingUrl ? `Join on Zoom: <a href="${meetingUrl}">${esc(meetingUrl)}</a>` : esc(where),
      b.paid ? `Paid: $${b.paid.toFixed(2)}${cal.pay_mode === "deposit" ? " deposit" : ""}. Your receipt comes from Stripe.` : "",
      cal.confirmation_note ? esc(cal.confirmation_note) : "",
      "A calendar invitation is on its way too.",
    ],
    button: { label: "Reschedule or cancel", url: manage },
  });
  const hostTo = Array.from(new Set([host.email, ...cal.cc_emails].map((e) => e.toLowerCase())));
  await sendMail(who, {
    to: hostTo,
    replyTo: b.email,
    fromName: SUITE_NAME,
    subject: `${b.rescheduled ? "Rescheduled" : "New booking"}: ${cal.name} with ${b.name}, ${fmt(startISO, host.timezone, "short")}`,
    heading: `${b.rescheduled ? "Rescheduled" : "New"} ${cal.name}`,
    lines: [
      `<strong>${esc(b.name)}</strong> · <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>${b.phone ? ` · ${esc(b.phone)}` : ""}`,
      b.paid ? `Paid $${b.paid.toFixed(2)}${cal.pay_mode === "deposit" ? " (deposit)" : ""} to your Stripe account.` : "",
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
    const who = await accountSender(b.master_plan_id, { marketing: false }, db);
    await sendMail(who, {
      to: b.invitee_email,
      replyTo: host.email,
      fromName: host.name,
      subject: `Canceled: ${cal.name} on ${fmt(b.start_at, tz, "short")}`,
      heading: "Your meeting is canceled",
      lines: [`${esc(cal.name)} with ${esc(host.name)}, ${esc(fmt(b.start_at, tz))}, has been canceled.`, reason ? `Note: ${esc(reason)}` : ""],
      button: { label: "Book a new time", url: `${APP()}/book/${cal.slug}` },
    });
    await sendMail(who, {
      to: Array.from(new Set([host.email, ...(cal.cc_emails as string[])].map((e: string) => e.toLowerCase()))),
      replyTo: b.invitee_email,
      fromName: SUITE_NAME,
      subject: `Canceled: ${cal.name} with ${b.invitee_name}, ${fmt(b.start_at, host.timezone, "short")}`,
      heading: `${cal.name} canceled`,
      lines: [`${esc(b.invitee_name)} (${esc(b.invitee_email)}) · ${esc(fmt(b.start_at, host.timezone))}`, `Canceled ${by === "invitee" ? "by them" : "by you"}${reason ? `: ${esc(reason)}` : ""}`, Number(b.paid_amount) > 0 ? `They paid $${Number(b.paid_amount).toFixed(2)} when booking. Payments aren't refunded automatically: refund it in your Stripe account if your policy allows.` : ""],
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
  const sender = senderCache(db);
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
    // A text too, when they ticked "text me reminders" (task 1151). Never between 9 PM and 8 AM their time.
    if (b.sms_ok && b.invitee_phone) await textReminder(db, b, which, cal?.name || "appointment", tz).catch((e) => console.error("sms reminder:", e));
    const who = await sender(b.master_plan_id as string, false);
    if (!who.ok) continue; // client account without its own verified domain: no reminder email
    await sendMail(who, {
      to: b.invitee_email,
      replyTo: host?.email,
      fromName: host?.name || SUITE_NAME,
      subject: `${which === "r1" ? "In 1 hour" : "Tomorrow"}: ${cal.name} with ${host?.name}`,
      heading: which === "r1" ? "See you soon" : "A reminder for tomorrow",
      lines: [`<strong>${esc(cal.name)}</strong> with ${esc(host?.name || "")}`, esc(fmt(b.start_at, tz)), b.meeting_url ? `Join on Zoom: <a href="${b.meeting_url}">${esc(b.meeting_url)}</a>` : ""],
    });
    sent++;
  }
  return sent;
}

async function textReminder(db: Db, b: Record<string, unknown>, which: "r1" | "r24", event: string, tz: string) {
  if (inQuietHours(new Date(), tz)) return;
  const planId = b.master_plan_id as string;
  const { data: acct } = await db.from("sms_accounts").select("status, reminders_on, reminder_24h, reminder_1h, template_24h, template_1h, business").eq("master_plan_id", planId).maybeSingle();
  if (!acct || acct.status !== "approved" || !acct.reminders_on) return;
  if ((which === "r24" && !acct.reminder_24h) || (which === "r1" && !acct.reminder_1h)) return;
  const biz = (acct.business ?? {}) as { dba?: string; legalName?: string };
  const start = new Date(String(b.start_at));
  const time = start.toLocaleString("en-US", { timeZone: tz, weekday: which === "r24" ? "long" : undefined, hour: "numeric", minute: "2-digit" });
  const date = start.toLocaleDateString("en-US", { timeZone: tz, month: "long", day: "numeric" });
  const first = String(b.invitee_name || "").trim().split(/\s+/)[0] || "";
  const body = fillReminder((which === "r24" ? acct.template_24h : acct.template_1h) || (which === "r24" ? DEFAULT_24H : DEFAULT_1H), { first, business: biz.dba || biz.legalName || "Your appointment", event, time, date });
  const { data: c } = await db.from("seq_contacts").select("id").eq("master_plan_id", planId).eq("email", String(b.invitee_email || "")).maybeSingle();
  await sendSms(db, planId, { to: String(b.invitee_phone), body, kind: "reminder", contactId: (c?.id as string) ?? null, bookingId: String(b.id) });
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

const SUITE_NAME = "LifeCharter Command Suite";

// Babs's account: exactly as always (reminders@lccommandsuite.com, the Command Suite
// support address). A client account: only from its own verified domain, with its own
// support address; if it can't send yet, nothing is emailed (never a Babs address).
export async function sendMail(who: AccountSender, m: { to: string | string[]; replyTo?: string; fromName: string; subject: string; heading: string; lines: string[]; button?: { label: string; url: string } }) {
  if (!who.ok) return;
  // A client account sends through its own Resend key; Babs's account uses the Suite's.
  const key = who.house ? process.env.RESEND_API_KEY : who.resendKey;
  if (!key) return;
  const fromAddr = who.house ? "reminders@lccommandsuite.com" : who.fromEmail;
  const fromName = who.house ? m.fromName : m.fromName === SUITE_NAME ? who.fromName : m.fromName;
  const support = who.house ? "support@lccommandsuite.com" : who.supportEmail;
  const body = m.lines.filter(Boolean).map((l) => `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${l}</p>`).join("");
  const button = m.button
    ? `<p style="margin:18px 0 6px"><a href="${m.button.url}" style="display:inline-block;background:#2E7C83;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:11px 22px;border-radius:999px">${esc(m.button.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#FBF8F1"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;padding:28px;border:1px solid #EADFCF"><tr><td><h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:22px;color:#0F5B63">${esc(m.heading)}</h1>${body}${button}<p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#9aa3ad">Questions? Reply to this email${support ? ` or write to ${esc(support)}` : ""}.</p></td></tr></table></td></tr></table></body></html>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${fromName.replace(/[<>"]/g, "")} <${fromAddr}>`, to: m.to, reply_to: m.replyTo, subject: m.subject, html }),
  }).catch((e) => console.error("booking mail:", e));
}

// A booked call was attended or missed (marked by the host, or read from Zoom): the booking, the no-show follow-up, the
// client package session, the contact's tag and timeline, and a Call to Close card all follow from one place.
export async function setBookingOutcome(db: Db, planId: string, bookingId: string, status: "completed" | "no_show"): Promise<boolean> {
  const { data: bk } = await db.from("bookings").select("id, contact_id, calendar_id, status").eq("id", bookingId).eq("master_plan_id", planId).maybeSingle();
  if (!bk) return false;
  await db.from("bookings").update({ status }).eq("id", bk.id).eq("master_plan_id", planId);
  if (status === "no_show" && bk.status === "confirmed") await markNoShow(bk.id as string).catch((e) => console.error("no-show follow-up:", e));
  if (status === "completed") await import("@/lib/portal").then((m) => m.countAttendedSession(db, planId, bk.id as string)).catch((e) => console.error("package session:", e));
  if (bk.contact_id) {
    const { data: cal } = await db.from("booking_calendars").select("name, slug").eq("id", bk.calendar_id).eq("master_plan_id", planId).maybeSingle();
    await logEvent(planId, bk.contact_id as string, "booking", `${status === "no_show" ? "Missed" : "Attended"} ${cal?.name ?? "meeting"}`, { booking: bk.id });
    const { data: c } = await db.from("seq_contacts").select("tags").eq("id", bk.contact_id).eq("master_plan_id", planId).maybeSingle();
    const tag = `${status === "no_show" ? "no-show" : "attended"}-${cal?.slug ?? "meeting"}`;
    await db.from("seq_contacts").update({ tags: Array.from(new Set([...((c?.tags as string[]) ?? []), tag])), tag_source: `booking:${cal?.slug ?? "meeting"}` }).eq("id", bk.contact_id).eq("master_plan_id", planId);
  }
  await c2cOnOutcome(db, planId, bk.id as string, status === "completed" ? "attended" : "no_show").catch((e) => console.error("call to close outcome:", e));
  return true;
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
  const who = await accountSender(b.master_plan_id, { marketing: false }, db);
  if (!who.ok) return; // client account without its own verified domain: no follow-up email
  await sendMail(who, {
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
