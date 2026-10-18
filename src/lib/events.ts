import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { accountSender } from "@/lib/email/accountSender";
import { fmt, sendMail } from "@/lib/booking/engine";
import { EMAIL_RE, logEvent, upsertContact } from "@/lib/crm";
import { enrolContact, isValidTz } from "@/lib/sequences/engine";
import { brandFor } from "@/lib/portal";
import { dayInTz } from "@/lib/tz";

// Event engine for every account (task 1149). A live event (webinar, MasterClass, workshop) or a multi-day challenge:
// a public sign-up page at /e/<slug> in the account's branding, a confirmation with an add-to-calendar link, reminders
// 24 hours and 1 hour before, the join link the owner pastes, attendance, a replay email with an optional expiry and a
// reminder before it closes, and a follow-up campaign. A challenge emails each day at the send hour and unlocks it on a
// private page (/e/<slug>/c/<token>) where people tick days off. Everything sends from the account's own address.

type Db = ReturnType<typeof createServerClient>;
const SITE = () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const DAY = 86_400_000;

export interface EventRow {
  id: string; master_plan_id: string; kind: "live" | "challenge"; slug: string; title: string; subtitle: string | null; description: string | null;
  host_name: string | null; accent: string | null; starts_at: string | null; duration_min: number; timezone: string; join_url: string | null;
  days: number | null; starts_on: string | null; send_hour: number; capacity: number | null; tags: string[]; follow_up_key: string | null;
  replay_url: string | null; replay_hours: number | null; replay_sent_at: string | null; status: "draft" | "published" | "ended";
}
export interface RegRow {
  id: string; event_id: string; master_plan_id: string; contact_id: string | null; email: string; first_name: string | null; timezone: string | null; token: string;
  attended: boolean | null; reminded_24h_at: string | null; reminded_1h_at: string | null; challenge_start: string | null; last_day_sent: number; replay_sent_at: string | null; replay_reminded_at: string | null;
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
export const newRegToken = () => randomBytes(18).toString("base64url");
export const eventUrl = (slug: string) => `${SITE()}/e/${slug}`;
export const challengeUrl = (slug: string, token: string) => `${SITE()}/e/${slug}/c/${token}`;
export const replayUrl = (slug: string, token: string) => `${SITE()}/e/${slug}/replay?r=${token}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Google Calendar "add event" link for a live event. */
export function googleCalendarUrl(e: Pick<EventRow, "title" | "starts_at" | "duration_min" | "join_url" | "description">): string | null {
  if (!e.starts_at) return null;
  const s = new Date(e.starts_at);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(s.getTime() + e.duration_min * 60_000);
  const u = new URL("https://calendar.google.com/calendar/render");
  u.searchParams.set("action", "TEMPLATE");
  u.searchParams.set("text", e.title);
  u.searchParams.set("dates", `${f(s)}/${f(end)}`);
  u.searchParams.set("details", [e.join_url ? `Join: ${e.join_url}` : "", (e.description || "").slice(0, 800)].filter(Boolean).join("\n\n"));
  if (e.join_url) u.searchParams.set("location", e.join_url);
  return u.toString();
}

/** An .ics file for Apple Calendar and Outlook. */
export function icsFor(e: Pick<EventRow, "id" | "title" | "starts_at" | "duration_min" | "join_url" | "description">): string {
  const s = new Date(e.starts_at!);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(s.getTime() + e.duration_min * 60_000);
  const clean = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LifeCharter Command Suite//Events//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${e.id}@lccommandsuite.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(end)}`, `SUMMARY:${clean(e.title)}`,
    `DESCRIPTION:${clean([e.join_url ? `Join: ${e.join_url}` : "", e.description || ""].filter(Boolean).join("\n\n").slice(0, 1500))}`,
    ...(e.join_url ? [`LOCATION:${clean(e.join_url)}`, `URL:${e.join_url}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

/** Which challenge day it is for someone (1 = the first day), in the event's time zone. 0 = not started yet. */
export function challengeDay(start: string, today: string): number {
  const d = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / DAY);
  return d < 0 ? 0 : d + 1;
}
const localHour = (tz: string) => Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date()));
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** The day a person's challenge starts: the event's fixed start, or the day after they sign up. */
export const startFor = (e: Pick<EventRow, "starts_on" | "timezone">, signedUpISO: string) => e.starts_on || addDays(dayInTz(signedUpISO, e.timezone), 1);

async function mailer(db: Db, planId: string) {
  const [who, brand] = await Promise.all([accountSender(planId, { marketing: false }, db), brandFor(db, planId)]);
  return { who, brand };
}

/** Sign someone up (or return their existing sign-up). Sends the confirmation from the account's own address. */
export async function register(db: Db, e: EventRow, input: { email: string; firstName: string; lastName?: string; timezone?: string | null }): Promise<{ ok: true; token: string; already: boolean } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim().slice(0, 80);
  if (!firstName) return { ok: false, error: "Please enter your first name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (e.status !== "published") return { ok: false, error: "Registration isn't open." };
  if (e.kind === "live" && e.starts_at && Date.parse(e.starts_at) + e.duration_min * 60_000 < Date.now()) return { ok: false, error: "This event has already happened." };
  const { data: have } = await db.from("event_registrations").select("token").eq("event_id", e.id).eq("email", email).maybeSingle();
  if (have) return { ok: true, token: have.token as string, already: true };
  if (e.capacity) {
    const { count } = await db.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", e.id);
    if ((count ?? 0) >= e.capacity) return { ok: false, error: "This event is full." };
  }
  const tz = input.timezone && isValidTz(input.timezone) ? input.timezone : e.timezone;
  const contact = await upsertContact({ masterPlanId: e.master_plan_id, email, firstName, lastName: input.lastName || null, timezone: tz, source: `event:${e.slug}`, tags: [`registered-${e.slug}`, ...e.tags] }, db).catch(() => null);
  const token = newRegToken();
  const now = new Date().toISOString();
  const { error } = await db.from("event_registrations").insert({
    event_id: e.id, master_plan_id: e.master_plan_id, contact_id: contact?.id ?? null, email, first_name: firstName, timezone: tz, token,
    challenge_start: e.kind === "challenge" ? startFor(e, now) : null,
  });
  if (error) {
    const { data: again } = await db.from("event_registrations").select("token").eq("event_id", e.id).eq("email", email).maybeSingle();
    return again ? { ok: true, token: again.token as string, already: true } : { ok: false, error: "That didn't save. Please try again." };
  }
  if (contact) await logEvent(e.master_plan_id, contact.id, "form", `Registered for ${e.title}`, { event: e.slug }, db).catch(() => {});
  await sendConfirmation(db, e, { email, first_name: firstName, timezone: tz, token }).catch((x) => console.error("event confirmation:", x));
  return { ok: true, token, already: false };
}

async function sendConfirmation(db: Db, e: EventRow, r: { email: string; first_name: string | null; timezone: string | null; token: string }) {
  const { who, brand } = await mailer(db, e.master_plan_id);
  const from = e.host_name || brand.name;
  const tz = r.timezone || e.timezone;
  if (e.kind === "live" && e.starts_at) {
    const g = googleCalendarUrl(e);
    await sendMail(who, {
      to: r.email, fromName: from,
      subject: `You're registered: ${e.title}`,
      heading: `You're in, ${r.first_name || "friend"}!`,
      lines: [
        `<strong>${esc(e.title)}</strong>`,
        `${esc(fmt(e.starts_at, tz))}`,
        e.join_url ? `Join here when it's time: <a href="${e.join_url}">${esc(e.join_url)}</a>` : "The join link comes in your reminder emails.",
        `Add it to your calendar: ${g ? `<a href="${g}">Google Calendar</a> · ` : ""}<a href="${SITE()}/api/e/${e.slug}/ics">Apple or Outlook</a>`,
        "We'll send you a reminder the day before and an hour before we start.",
      ],
      ...(e.join_url ? { button: { label: "Save the join link", url: e.join_url } } : {}),
    });
  } else {
    const start = e.starts_on || startFor(e, new Date().toISOString());
    await sendMail(who, {
      to: r.email, fromName: from,
      subject: `Welcome to ${e.title}`,
      heading: `Welcome, ${r.first_name || "friend"}!`,
      lines: [
        `You're signed up for <strong>${esc(e.title)}</strong>: ${e.days ?? 0} days.`,
        `Day 1 arrives by email on ${esc(new Date(`${start}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }))}. Each day also opens on your challenge page, where you can tick it off.`,
      ],
      button: { label: "Open my challenge page", url: challengeUrl(e.slug, r.token) },
    });
  }
}

/** Email the replay to everyone registered (and start the follow-up campaign). Safe to press once per event. */
export async function sendReplay(db: Db, e: EventRow): Promise<number> {
  if (!e.replay_url) throw new Error("Add the replay link first.");
  const { who, brand } = await mailer(db, e.master_plan_id);
  if (!who.ok) throw new Error(who.reason || "Set up email sending first (Contacts › Email sending).");
  const { data: regs } = await db.from("event_registrations").select("*").eq("event_id", e.id).is("replay_sent_at", null);
  const now = new Date().toISOString();
  await db.from("events").update({ replay_sent_at: e.replay_sent_at ?? now, updated_at: now }).eq("id", e.id);
  let n = 0;
  for (const r of (regs ?? []) as RegRow[]) {
    const expiry = e.replay_hours ? ` It's available for ${e.replay_hours} hours.` : "";
    await sendMail(who, {
      to: r.email, fromName: e.host_name || brand.name,
      subject: r.attended ? `The replay: ${e.title}` : `You missed it, here's the replay: ${e.title}`,
      heading: r.attended ? `Thank you for being there, ${r.first_name || "friend"}` : `We missed you, ${r.first_name || "friend"}`,
      lines: [`The replay of <strong>${esc(e.title)}</strong> is ready.${expiry}`],
      button: { label: "Watch the replay", url: replayUrl(e.slug, r.token) },
    });
    await db.from("event_registrations").update({ replay_sent_at: now }).eq("id", r.id);
    if (e.follow_up_key) await enrolContact({ masterPlanId: e.master_plan_id, sequenceKey: e.follow_up_key, email: r.email, firstName: r.first_name, source: `event:${e.slug}` }).catch(() => null);
    n++;
  }
  return n;
}

/** Is the replay still open? (null expiry = always open). */
export function replayOpen(e: Pick<EventRow, "replay_url" | "replay_hours" | "replay_sent_at">): boolean {
  if (!e.replay_url) return false;
  if (!e.replay_hours || !e.replay_sent_at) return true;
  return Date.now() < Date.parse(e.replay_sent_at) + e.replay_hours * 3_600_000;
}

/** The every-15-minutes job: reminders, challenge days, replay closing reminders, follow-ups after a challenge. */
export async function runEvents(db: Db): Promise<Record<string, number>> {
  const out = { r24: 0, r1: 0, days: 0, replayReminders: 0, followUps: 0 };
  const { data: events } = await db.from("events").select("*").eq("status", "published").limit(500);
  for (const e of (events ?? []) as EventRow[]) {
    try {
      const { who, brand } = await mailer(db, e.master_plan_id);
      if (!who.ok) continue;
      const from = e.host_name || brand.name;
      const { data: regs } = await db.from("event_registrations").select("*").eq("event_id", e.id).limit(5000);
      const list = (regs ?? []) as RegRow[];
      if (e.kind === "live" && e.starts_at) {
        const until = Date.parse(e.starts_at) - Date.now();
        for (const r of list) {
          const tz = r.timezone || e.timezone;
          if (until > 0 && until <= 24 * 3_600_000 && until > 2 * 3_600_000 && !r.reminded_24h_at) {
            await sendMail(who, { to: r.email, fromName: from, subject: `Tomorrow: ${e.title}`, heading: `See you tomorrow, ${r.first_name || "friend"}`, lines: [`<strong>${esc(e.title)}</strong> starts ${esc(fmt(e.starts_at, tz))}.`, e.join_url ? `Join here: <a href="${e.join_url}">${esc(e.join_url)}</a>` : ""], ...(e.join_url ? { button: { label: "Join link", url: e.join_url } } : {}) });
            await db.from("event_registrations").update({ reminded_24h_at: new Date().toISOString() }).eq("id", r.id);
            out.r24++;
          }
          if (until > 0 && until <= 75 * 60_000 && !r.reminded_1h_at) {
            await sendMail(who, { to: r.email, fromName: from, subject: `Starting soon: ${e.title}`, heading: "We start in about an hour", lines: [`<strong>${esc(e.title)}</strong> · ${esc(fmt(e.starts_at, tz, "short"))}`, e.join_url ? `Join here: <a href="${e.join_url}">${esc(e.join_url)}</a>` : ""], ...(e.join_url ? { button: { label: "Join now", url: e.join_url } } : {}) });
            await db.from("event_registrations").update({ reminded_1h_at: new Date().toISOString() }).eq("id", r.id);
            out.r1++;
          }
        }
      }
      if (e.kind === "challenge" && e.days) {
        const today = dayInTz(new Date(), e.timezone);
        if (localHour(e.timezone) >= e.send_hour) {
          const { data: days } = await db.from("event_days").select("day, title, body, action").eq("event_id", e.id);
          const byDay = new Map(((days ?? []) as { day: number; title: string; body: string | null; action: string | null }[]).map((d) => [d.day, d]));
          for (const r of list) {
            const n = challengeDay(r.challenge_start || startFor(e, new Date().toISOString()), today);
            if (n >= 1 && n <= e.days && n > r.last_day_sent) {
              const d = byDay.get(n);
              await sendMail(who, {
                to: r.email, fromName: from,
                subject: `Day ${n} of ${e.days}: ${d?.title || e.title}`,
                heading: `Day ${n}: ${d?.title || "today's step"}`,
                lines: [d?.body ? esc(d.body.slice(0, 600)).replace(/\n/g, "<br>") + (d.body.length > 600 ? "…" : "") : "", d?.action ? `<strong>Today's step:</strong> ${esc(d.action)}` : ""],
                button: { label: `Open day ${n}`, url: challengeUrl(e.slug, r.token) },
              });
              await db.from("event_registrations").update({ last_day_sent: n }).eq("id", r.id);
              out.days++;
            }
            // The challenge is over: start the follow-up campaign once.
            if (n > e.days && e.follow_up_key && !r.replay_sent_at) {
              await enrolContact({ masterPlanId: e.master_plan_id, sequenceKey: e.follow_up_key, email: r.email, firstName: r.first_name, source: `event:${e.slug}` }).catch(() => null);
              await db.from("event_registrations").update({ replay_sent_at: new Date().toISOString() }).eq("id", r.id);
              out.followUps++;
            }
          }
        }
      }
      // The replay closes soon: one reminder, about 12 hours before (registrants who got the replay).
      if (e.replay_sent_at && e.replay_hours && e.replay_url) {
        const closes = Date.parse(e.replay_sent_at) + e.replay_hours * 3_600_000;
        const left = closes - Date.now();
        if (left > 0 && left <= 12 * 3_600_000) {
          for (const r of list.filter((x) => x.replay_sent_at && !x.replay_reminded_at)) {
            await sendMail(who, { to: r.email, fromName: from, subject: `Last chance: the replay of ${e.title} closes soon`, heading: "The replay closes soon", lines: [`The replay of <strong>${esc(e.title)}</strong> comes down in about ${Math.max(1, Math.round(left / 3_600_000))} hours.`], button: { label: "Watch the replay", url: replayUrl(e.slug, r.token) } });
            await db.from("event_registrations").update({ replay_reminded_at: new Date().toISOString() }).eq("id", r.id);
            out.replayReminders++;
          }
        }
      }
    } catch (x) {
      console.error("events run:", e.slug, x instanceof Error ? x.message : x);
    }
  }
  return out;
}
