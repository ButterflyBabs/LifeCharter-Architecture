import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";

// MasterClass performance: one funnel per session, and the series event to event (Babs approved 2026-09-27;
// funnel per session asked for 2026-10-11).
// Sessions: every other Thursday at 5pm MT from Oct 8, 2026 (Babs, 2026-10-05), then WEEKLY on Wednesdays at noon MT,
// 60 minutes, from Oct 28, 2026 (soft open) and Nov 4 (first public class) (Babs, 2026-10-23). Add a date to SKIP if a
// session is cancelled.
const FIRST_SESSION = "2026-10-08";
const WEEKLY_FROM = "2026-10-28"; // the first Wednesday-noon class; earlier dates stay on the old Thursday 5pm schedule
const LAST_SESSION = "2027-12-29";
const SKIP: string[] = ["2026-11-25", "2026-12-23", "2026-12-30"]; // Thanksgiving week and the two holiday weeks
const CREDIT_DAYS = 14; // a booking or sale counts for the most recent session within this many days (the follow-up series runs two weeks)
const UPCOMING_SHOWN = 2; // how many sessions ahead are tracked as they fill
export const REGISTRATION_GOAL = 50; // her goal per weekly class: 50 registrations and 25 in the room (2026-10-23; was 120 for two sessions a month)
export const ATTENDANCE_GOAL = 25;
export const ADS_START = "2026-10-10"; // paid ads began here (Babs, 2026-10-11); earlier spend is not counted
const AD_CATEGORY = /^(ads?|ad spend|advertising|paid (ads|social|media)|meta ads|facebook ads)\b/i;

// First-year value per tier: implementation + 12 months.
export const FIRST_YEAR_VALUE: Record<string, number> = { starter: 6661, growth: 8961, vip: 16961 };

const TEST_EMAIL = /@example\.com$|^claude-verify|\+eloise/i;

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function todayMT(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(now);
}
/** When a session starts in Mountain time, as a UTC instant (handles daylight saving): 5:00pm before the weekly run, noon from it. */
export function startMT(date: string) {
  const want = date >= WEEKLY_FROM ? 12 : 17;
  for (const offset of [6, 7]) {
    const guess = new Date(`${date}T${String(want + offset).padStart(2, "0")}:00:00Z`);
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }).format(guess)) % 24;
    if (hour === want) return guess;
  }
  return new Date(`${date}T${String(want + 6).padStart(2, "0")}:00:00Z`);
}
/** Kept under its old name for callers that still use it. */
export const fivePmMT = startMT;

/** Every session date in order: every other Thursday up to the weekly run, then every Wednesday. */
function sessionDates(): string[] {
  const out: string[] = [];
  for (let d = FIRST_SESSION; d < WEEKLY_FROM; d = addDays(d, 14)) out.push(d);
  for (let d = WEEKLY_FROM; d <= LAST_SESSION; d = addDays(d, 7)) out.push(d);
  return out.filter((d) => !SKIP.includes(d));
}

export interface FunnelInput {
  now: Date;
  registrants: { email: string; at: string; details?: Record<string, string> | null }[]; // MasterClass Zoom registrations (time they registered, what they typed)
  attendance: { session_date: string; email: string }[];
  clicks: string[]; // created_at of every MasterClass tracking-link click
  consultRequests: { email: string; created_at: string }[];
  bookings: { email: string; created_at: string }[]; // Executive Consultation bookings, not cancelled
  clients: { tier: string; at: string }[]; // one per person
  websiteBuilds: { created_at: string }[];
  adSpend: { occurred_on: string; amount: number }[];
}

export type SessionRow = {
  date: string;
  state: "held" | "next" | "upcoming";
  daysToGo: number | null; // whole days until it starts (upcoming and next only)
  goal: number;
  clicks: number; // tracking-link clicks in its promotion window
  newRegistrations: number; // registered since the previous session started
  attended: number;
  attendedNew: number;
  showRate: number | null; // attendedNew / newRegistrations
  noShows: string[]; // registered for this session, didn't attend (emails)
  consultRequests: number;
  consultBooked: number;
  newClients: { starter: number; growth: number; vip: number };
  closes: number;
  websiteBuilds: number; // Website Alignment Builds sold in this session's credit window
  firstYearRevenue: number;
  adSpend: number; // ad spend in its promotion window, from Finance (category Ads), since ADS_START
  costPerRegistration: number | null;
  costPerAttendee: number | null;
  costPerBooking: number | null;
  costPerClose: number | null;
};

const per = (spend: number, n: number) => (spend > 0 && n > 0 ? spend / n : null);

/** The funnel for every session held so far and the next few. Pure: all data comes in as arguments. */
export function computeFunnel(inp: FunnelInput): SessionRow[] {
  const today = todayMT(inp.now);
  const held: string[] = [];
  const ahead: string[] = [];
  for (const d of sessionDates()) {
    // A session counts as held two hours after it starts.
    if (startMT(d).getTime() + 2 * 3600_000 <= inp.now.getTime()) held.push(d);
    else if (ahead.length < UPCOMING_SHOWN) ahead.push(d);
    else break;
  }
  const dates = [...held, ...ahead];

  const registrants = inp.registrants.filter((r) => !TEST_EMAIL.test(r.email));
  const consults = inp.consultRequests.filter((q) => !TEST_EMAIL.test(q.email || ""));
  const books = inp.bookings.filter((b) => !TEST_EMAIL.test(b.email || ""));
  const clientRows = inp.clients;
  const spends = inp.adSpend.filter((s) => s.occurred_on >= ADS_START);

  return dates.map((date, idx) => {
    const start = startMT(date).getTime();
    const prevDate = idx > 0 ? dates[idx - 1] : null;
    const prevStart = prevDate ? startMT(prevDate).getTime() : 0;
    const nextStart = idx < dates.length - 1 ? startMT(dates[idx + 1]).getTime() : Infinity;
    const creditEnd = Math.min(start + CREDIT_DAYS * 86400_000, nextStart);
    const inCredit = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= start && t < creditEnd;
    };
    const inPromo = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= prevStart && t < start;
    };
    const state: SessionRow["state"] = held.includes(date) ? "held" : date === ahead[0] ? "next" : "upcoming";

    const newRegs = registrants.filter((r) => inPromo(r.at));
    const newEmails = new Set(newRegs.map((r) => r.email.toLowerCase()));
    const came = inp.attendance.filter((a) => a.session_date === date && !TEST_EMAIL.test(a.email));
    const attendedNew = came.filter((a) => newEmails.has(a.email.toLowerCase())).length;
    const cameEmails = new Set(came.map((a) => a.email.toLowerCase()));
    const noShows = state === "held" ? Array.from(newEmails).filter((e) => !cameEmails.has(e)).sort() : [];

    const tiers = { starter: 0, growth: 0, vip: 0 };
    let revenue = 0;
    for (const c of clientRows) {
      if (!inCredit(c.at)) continue;
      const t = (c.tier || "").toLowerCase() as keyof typeof tiers;
      if (t in tiers) {
        tiers[t] += 1;
        revenue += FIRST_YEAR_VALUE[t] ?? 0;
      }
    }
    const closes = tiers.starter + tiers.growth + tiers.vip;
    const consultBooked = books.filter((b) => inCredit(b.created_at)).length;
    const adSpend = spends
      .filter((s) => s.occurred_on <= date && (prevDate === null || s.occurred_on > prevDate))
      .reduce((a, s) => a + Number(s.amount || 0), 0);
    const daysToGo = state === "held" ? null : Math.max(0, Math.round((new Date(`${date}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86400_000));

    return {
      date,
      state,
      daysToGo,
      goal: REGISTRATION_GOAL,
      clicks: inp.clicks.filter(inPromo).length,
      newRegistrations: newRegs.length,
      attended: came.length,
      attendedNew,
      showRate: state === "held" && newRegs.length ? attendedNew / newRegs.length : null,
      noShows,
      consultRequests: consults.filter((q) => inCredit(q.created_at)).length,
      consultBooked,
      newClients: tiers,
      closes,
      websiteBuilds: inp.websiteBuilds.filter((b) => inCredit(b.created_at)).length,
      firstYearRevenue: revenue,
      adSpend: Math.round(adSpend * 100) / 100,
      costPerRegistration: per(adSpend, newRegs.length),
      costPerAttendee: per(adSpend, attendedNew),
      costPerBooking: per(adSpend, consultBooked),
      costPerClose: per(adSpend, closes),
    };
  });
}

export interface RegistrationRow {
  email: string;
  name: string;
  at: string; // when they registered
  source: string; // where they came from, when known
  status: "registered" | "attended" | "no-show";
  returning: boolean; // registered for an earlier session too
  details: Record<string, string>; // what they typed on the registration form (phone, organization, answers)
}
export interface EventRegistrations {
  date: string;
  state: SessionRow["state"];
  goal: number;
  rows: RegistrationRow[];
}

const SOURCE_TAGS: [RegExp, string][] = [
  [/^from-instagram$/i, "Instagram"],
  [/^from-linkedin$/i, "LinkedIn"],
  [/^from-facebook$/i, "Facebook"],
  [/^lead-meta-ad$/i, "Meta ad"],
];

/** Everyone who registered for each session (by the same windows as the funnel), newest first. */
export function registrationsByEvent(
  inp: Pick<FunnelInput, "now" | "registrants" | "attendance">,
  sessions: SessionRow[],
  contacts: Map<string, { name: string; tags: string[] }>,
): EventRegistrations[] {
  const registrants = inp.registrants.filter((r) => !TEST_EMAIL.test(r.email));
  const seenBefore = new Set<string>();
  const out: EventRegistrations[] = sessions.map((sess, idx) => {
    const start = startMT(sess.date).getTime();
    const prevStart = idx > 0 ? startMT(sessions[idx - 1].date).getTime() : 0;
    const came = new Set(inp.attendance.filter((a) => a.session_date === sess.date).map((a) => a.email.toLowerCase()));
    const rows: RegistrationRow[] = registrants
      .filter((r) => {
        const t = new Date(r.at).getTime();
        return t >= prevStart && t < start;
      })
      .map((r) => {
        const e = r.email.toLowerCase();
        const c = contacts.get(e);
        const src = (c?.tags ?? []).map((t) => SOURCE_TAGS.find(([re]) => re.test(t))?.[1]).find(Boolean) || "";
        return {
          email: r.email,
          name: c?.name || "",
          at: r.at,
          source: src,
          status: sess.state !== "held" ? ("registered" as const) : came.has(e) ? ("attended" as const) : ("no-show" as const),
          returning: seenBefore.has(e),
          details: r.details || {},
        };
      })
      .sort((a, b) => b.at.localeCompare(a.at));
    for (const r of rows) seenBefore.add(r.email.toLowerCase());
    return { date: sess.date, state: sess.state, goal: sess.goal, rows };
  });
  return out.reverse();
}

export type Totals = {
  sessions: number;
  newRegistrations: number;
  attended: number;
  attendedNew: number;
  showRate: number | null;
  clicks: number;
  consultRequests: number;
  consultBooked: number;
  closes: number;
  newClients: { starter: number; growth: number; vip: number };
  websiteBuilds: number;
  firstYearRevenue: number;
  adSpend: number;
  costPerRegistration: number | null;
  costPerBooking: number | null;
  costPerClose: number | null;
};

/** The series across sessions already held. */
export function totalsOf(sessions: SessionRow[]): Totals {
  const heldRows = sessions.filter((s) => s.state === "held");
  const sum = (f: (s: SessionRow) => number) => heldRows.reduce((a, s) => a + f(s), 0);
  const regs = sum((s) => s.newRegistrations);
  const attendedNew = sum((s) => s.attendedNew);
  const adSpend = sum((s) => s.adSpend);
  const closes = sum((s) => s.closes);
  const booked = sum((s) => s.consultBooked);
  return {
    sessions: heldRows.length,
    newRegistrations: regs,
    attended: sum((s) => s.attended),
    attendedNew,
    showRate: regs ? attendedNew / regs : null,
    clicks: sum((s) => s.clicks),
    consultRequests: sum((s) => s.consultRequests),
    consultBooked: booked,
    closes,
    newClients: { starter: sum((s) => s.newClients.starter), growth: sum((s) => s.newClients.growth), vip: sum((s) => s.newClients.vip) },
    websiteBuilds: sum((s) => s.websiteBuilds),
    firstYearRevenue: sum((s) => s.firstYearRevenue),
    adSpend,
    costPerRegistration: per(adSpend, regs),
    costPerBooking: per(adSpend, booked),
    costPerClose: per(adSpend, closes),
  };
}

export async function masterclassResults(now = new Date()): Promise<{ sessions: SessionRow[]; totals: Totals; registrations: EventRegistrations[] }> {
  const supabase = createServerClient();
  const [regs, att, quals, subs, intakes, builds, cal, links, fin] = await Promise.all([
    supabase.from("zoom_registrant_syncs").select("email, synced_at, registered_at, event_key, details"),
    supabase.from("masterclass_attendance").select("session_date, email, event_key"),
    supabase.from("exec_consult_qualifications").select("email, source, created_at").eq("source", "masterclass"),
    supabase.from("subscriptions").select("user_id, plan_id, created_at"),
    supabase.from("client_intake_submissions").select("user_id, email, tier, created_at"),
    supabase.from("website_build_orders").select("email, created_at"),
    supabase.from("booking_calendars").select("id").eq("slug", "executive-consultation"),
    supabase.from("short_links").select("id").like("code", "mc-%"),
    // Babs's MasterClass funnel is in US dollars (ad spend and first-year values), so only USD ad spend counts.
    supabase.from("finance_entries").select("category, amount, occurred_on, type").eq("type", "expense").eq("currency", "usd").gte("occurred_on", ADS_START),
  ]);

  const registrants = ((regs.data ?? []) as { email: string; synced_at: string; registered_at: string | null; event_key: string | null; details: Record<string, string> | null }[])
    .filter((r) => !r.event_key || r.event_key === "masterclass")
    .map((r) => ({ email: r.email, at: r.registered_at || r.synced_at, details: r.details }));
  const attendance = ((att.data ?? []) as { session_date: string; email: string; event_key: string | null }[])
    .filter((a) => !a.event_key || a.event_key === "masterclass")
    .map((a) => ({ session_date: a.session_date, email: a.email }));

  // New clients from both paths, counted once per person (self-serve checkout and Marcello's form).
  const clients = new Map<string, { tier: string; at: string }>();
  for (const s of (subs.data ?? []) as { user_id: string; plan_id: string; created_at: string }[]) clients.set(s.user_id, { tier: s.plan_id, at: s.created_at });
  for (const i of (intakes.data ?? []) as { user_id: string | null; email: string; tier: string; created_at: string }[]) {
    if (TEST_EMAIL.test(i.email || "")) continue;
    const key = i.user_id || i.email;
    if (!clients.has(key)) clients.set(key, { tier: i.tier, at: i.created_at });
  }

  const calIds = ((cal.data ?? []) as { id: string }[]).map((c) => c.id);
  const { data: bk } = calIds.length
    ? await supabase.from("bookings").select("invitee_email, created_at, status").in("calendar_id", calIds).neq("status", "canceled")
    : { data: [] as never[] };
  const linkIds = ((links.data ?? []) as { id: string }[]).map((l) => l.id);
  const { data: clk } = linkIds.length
    ? await supabase.from("short_link_clicks").select("created_at").in("short_link_id", linkIds).limit(50000)
    : { data: [] as never[] };

  const input: FunnelInput = {
    now,
    registrants,
    attendance,
    clicks: ((clk ?? []) as { created_at: string }[]).map((c) => c.created_at),
    consultRequests: (quals.data ?? []) as { email: string; created_at: string }[],
    bookings: ((bk ?? []) as { invitee_email: string; created_at: string }[]).map((b) => ({ email: b.invitee_email, created_at: b.created_at })),
    clients: Array.from(clients.values()),
    websiteBuilds: ((builds.data ?? []) as { email: string | null; created_at: string }[]).filter((b) => !TEST_EMAIL.test(b.email || "")),
    adSpend: ((fin.data ?? []) as { category: string | null; amount: number; occurred_on: string }[]).filter((e) => AD_CATEGORY.test((e.category || "").trim())),
  };
  const sessions = computeFunnel(input);

  // Names and sources for the registrants, from Contacts (Babs's account).
  const contacts = new Map<string, { name: string; tags: string[] }>();
  const emails = Array.from(new Set(registrants.map((r) => r.email.toLowerCase())));
  if (emails.length) {
    const plan = await ownerMasterPlanId(supabase).catch(() => null);
    if (plan) {
      const { data: cs } = await supabase.from("seq_contacts").select("email, first_name, last_name, tags").eq("master_plan_id", plan).in("email", emails);
      for (const c of (cs ?? []) as { email: string; first_name: string | null; last_name: string | null; tags: string[] | null }[]) {
        contacts.set(c.email.toLowerCase(), { name: [c.first_name, c.last_name].filter(Boolean).join(" "), tags: c.tags ?? [] });
      }
    }
  }
  return { sessions, totals: totalsOf(sessions), registrations: registrationsByEvent(input, sessions, contacts) };
}
