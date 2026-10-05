import { createServerClient } from "@/lib/supabase/server";

// MasterClass performance, per session and cumulative (Babs approved 2026-09-27).
// Sessions: every other Thursday at 5pm MT, starting Oct 8, 2026 (Babs, 2026-10-05; none ran before
// that). Add a date to SKIP if a session is cancelled.
const FIRST_SESSION = "2026-10-08";
const LAST_SESSION = "2027-12-30";
const EVERY_DAYS = 14;
const SKIP: string[] = [];
const CREDIT_DAYS = 14; // a booking or sale counts for the most recent session within this many days (the follow-up series runs two weeks)

// First-year value per tier: implementation + 12 months.
export const FIRST_YEAR_VALUE: Record<string, number> = { starter: 6661, growth: 8961, vip: 16961 };

const TEST_EMAIL = /@example\.com$|^claude-verify/i;

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function todayMT() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver" }).format(new Date());
}
/** 5:00pm Mountain on a date, as a UTC instant (handles daylight saving). */
function fivePmMT(date: string) {
  for (const offset of [6, 7]) {
    const guess = new Date(`${date}T${String(17 + offset).padStart(2, "0")}:00:00Z`);
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Denver", hour: "numeric", hour12: false }).format(guess)) % 24;
    if (hour === 17) return guess;
  }
  return new Date(`${date}T23:00:00Z`);
}

export type SessionRow = {
  date: string;
  newRegistrations: number;
  attended: number;
  attendedNew: number;
  showRate: number | null; // attendedNew / newRegistrations
  noShows: string[]; // registered for this session, didn't attend (emails)
  websiteBuilds: number; // Website Alignment Builds sold in this session's credit window
  consultRequests: number;
  newClients: { starter: number; growth: number; vip: number };
  firstYearRevenue: number;
};

export async function masterclassResults(): Promise<{ sessions: SessionRow[]; totals: Omit<SessionRow, "date" | "showRate" | "noShows"> & { showRate: number | null; sessions: number } }> {
  const today = todayMT();
  const dates: string[] = [];
  for (let d = FIRST_SESSION; d <= LAST_SESSION && d <= today; d = addDays(d, EVERY_DAYS)) if (!SKIP.includes(d)) dates.push(d);

  const supabase = createServerClient();
  const [regs, att, quals, subs, intakes] = await Promise.all([
    supabase.from("zoom_registrant_syncs").select("email, synced_at"),
    supabase.from("masterclass_attendance").select("session_date, email"),
    supabase.from("exec_consult_qualifications").select("email, source, created_at").eq("source", "masterclass"),
    supabase.from("subscriptions").select("user_id, plan_id, created_at"),
    supabase.from("client_intake_submissions").select("user_id, email, tier, created_at"),
  ]);
  const { data: builds } = await supabase.from("website_build_orders").select("email, created_at");
  const buildRows = ((builds ?? []) as { email: string | null; created_at: string }[]).filter((b) => !TEST_EMAIL.test(b.email || ""));

  const registrants = ((regs.data ?? []) as { email: string; synced_at: string }[]).filter((r) => !TEST_EMAIL.test(r.email));
  const attendance = (att.data ?? []) as { session_date: string; email: string }[];
  const consults = ((quals.data ?? []) as { email: string; created_at: string }[]).filter((q) => !TEST_EMAIL.test(q.email || ""));
  // New clients from both paths, counted once per person (self-serve checkout and Marcello's form).
  const clients = new Map<string, { tier: string; at: string }>();
  for (const s of (subs.data ?? []) as { user_id: string; plan_id: string; created_at: string }[]) clients.set(s.user_id, { tier: s.plan_id, at: s.created_at });
  for (const i of (intakes.data ?? []) as { user_id: string | null; email: string; tier: string; created_at: string }[]) {
    if (TEST_EMAIL.test(i.email || "")) continue;
    const key = i.user_id || i.email;
    if (!clients.has(key)) clients.set(key, { tier: i.tier, at: i.created_at });
  }

  const sessions: SessionRow[] = dates.map((date, idx) => {
    const start = fivePmMT(date).getTime();
    const prevStart = idx > 0 ? fivePmMT(dates[idx - 1]).getTime() : 0;
    const nextStart = idx < dates.length - 1 ? fivePmMT(dates[idx + 1]).getTime() : Infinity;
    const creditEnd = Math.min(start + CREDIT_DAYS * 86400_000, nextStart);
    const inCredit = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= start && t < creditEnd;
    };

    // Registrations that came in after the previous session started, up to this one.
    const newRegs = registrants.filter((r) => {
      const t = new Date(r.synced_at).getTime();
      return t >= prevStart && t < start;
    });
    const newEmails = new Set(newRegs.map((r) => r.email.toLowerCase()));
    const came = attendance.filter((a) => a.session_date === date);
    const attendedNew = came.filter((a) => newEmails.has(a.email.toLowerCase())).length;
    const cameEmails = new Set(came.map((a) => a.email.toLowerCase()));
    const noShows = Array.from(newEmails).filter((e) => !cameEmails.has(e)).sort();

    const tiers = { starter: 0, growth: 0, vip: 0 };
    let revenue = 0;
    for (const c of Array.from(clients.values())) {
      if (!inCredit(c.at)) continue;
      const t = (c.tier || "").toLowerCase() as keyof typeof tiers;
      if (t in tiers) {
        tiers[t] += 1;
        revenue += FIRST_YEAR_VALUE[t] ?? 0;
      }
    }

    return {
      date,
      newRegistrations: newRegs.length,
      attended: came.length,
      attendedNew,
      showRate: newRegs.length ? attendedNew / newRegs.length : null,
      noShows,
      websiteBuilds: buildRows.filter((b) => inCredit(b.created_at)).length,
      consultRequests: consults.filter((q) => inCredit(q.created_at)).length,
      newClients: tiers,
      firstYearRevenue: revenue,
    };
  });

  const sum = (f: (s: SessionRow) => number) => sessions.reduce((a, s) => a + f(s), 0);
  const newRegistrations = sum((s) => s.newRegistrations);
  const attendedNew = sum((s) => s.attendedNew);
  return {
    sessions,
    totals: {
      sessions: sessions.length,
      newRegistrations,
      attended: sum((s) => s.attended),
      attendedNew,
      showRate: newRegistrations ? attendedNew / newRegistrations : null,
      consultRequests: sum((s) => s.consultRequests),
      newClients: {
        starter: sum((s) => s.newClients.starter),
        growth: sum((s) => s.newClients.growth),
        vip: sum((s) => s.newClients.vip),
      },
      firstYearRevenue: sum((s) => s.firstYearRevenue),
      websiteBuilds: sum((s) => s.websiteBuilds),
    },
  };
}
