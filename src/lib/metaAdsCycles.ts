import { dayInTz, zonedToUtcISO } from "@/lib/tz";

// Events that repeat (a MasterClass every other Thursday) start their sign-up count fresh after each one. A cycle runs from
// the end of the last event to the end of the next: the count for "the Nov 5 event" starts at 0 at 7:00 PM Mountain on Oct 22
// and closes at 7:00 PM Mountain on Nov 5. Sign-ups are counted by the minute they arrived; spend is counted by day.

export const TZ = "America/Denver";
const DAY = 86_400_000;

export type CycleSetup = { anchor: string; days: number; hour: number; goal: number | null };

export type Cycle = {
  eventDate: string; // the event that closes this cycle
  start: string; // ISO instant the count started
  end: string; // ISO instant the count closes
  signups: number;
  spend: number;
  costPer: number | null;
  goal: number | null;
  current: boolean;
  daysTotal: number;
  dayNumber: number; // 1-based, current cycle only (otherwise = daysTotal)
  daysLeft: number; // current cycle only (otherwise 0)
  projected: number | null; // current cycle only: sign-ups by the close at the pace so far
};

export type Month = {
  month: string; // YYYY-MM
  label: string;
  events: string[]; // event dates that fall in the month
  signups: number;
  spend: number;
  costPer: number | null;
  goal: number | null; // goal x events in the month
  current: boolean;
};

export type SpendRow = { periodStart: string; periodEnd: string; spend: number };

export const addDays = (day: string, n: number): string => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

const hh = (h: number) => `${String(Math.min(23, Math.max(0, Math.round(h)))).padStart(2, "0")}:00`;

/** The instant the count closes for the event k cycles after the anchor event (k can be negative). */
export function boundary(setup: CycleSetup, k: number): Date {
  return new Date(zonedToUtcISO(addDays(setup.anchor, k * setup.days), hh(setup.hour), TZ));
}

/** The cycle that is open at `now`: the one whose close is still ahead and whose start has passed. */
export function currentIndex(setup: CycleSetup, now: Date): number {
  let k = Math.floor((now.getTime() - boundary(setup, 0).getTime()) / (setup.days * DAY)) + 1;
  while (boundary(setup, k).getTime() <= now.getTime()) k++;
  while (boundary(setup, k - 1).getTime() > now.getTime()) k--;
  return k;
}

function spendOnDay(rows: SpendRow[], day: string): number {
  let total = 0;
  for (const r of rows) {
    if (day < r.periodStart || day > r.periodEnd) continue;
    const n = Math.max(1, Math.round((Date.parse(`${r.periodEnd}T00:00:00Z`) - Date.parse(`${r.periodStart}T00:00:00Z`)) / DAY) + 1);
    total += r.spend / n;
  }
  return total;
}

function spendBetween(rows: SpendRow[], firstDay: string, lastDay: string): number {
  let total = 0;
  for (let d = firstDay; d <= lastDay; d = addDays(d, 1)) total += spendOnDay(rows, d);
  return Math.round(total * 100) / 100;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The open cycle and the ones before it, newest first. */
export function buildCycles(setup: CycleSetup, signupTimes: Date[], spendRows: SpendRow[], now: Date, back = 3): Cycle[] {
  const cur = currentIndex(setup, now);
  const out: Cycle[] = [];
  for (let k = cur; k >= cur - back; k--) {
    const start = boundary(setup, k - 1);
    const end = boundary(setup, k);
    const eventDate = addDays(setup.anchor, k * setup.days);
    const firstDay = addDays(eventDate, -setup.days + 1);
    const signups = signupTimes.filter((t) => t >= start && t < end).length;
    const isCurrent = k === cur;
    const spend = spendBetween(spendRows, firstDay, eventDate);
    const elapsed = Math.min(setup.days, Math.max(1, Math.floor((now.getTime() - start.getTime()) / DAY) + 1));
    out.push({
      eventDate,
      start: start.toISOString(),
      end: end.toISOString(),
      signups,
      spend,
      costPer: signups > 0 && spend > 0 ? round2(spend / signups) : null,
      goal: setup.goal,
      current: isCurrent,
      daysTotal: setup.days,
      dayNumber: isCurrent ? elapsed : setup.days,
      daysLeft: isCurrent ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY)) : 0,
      projected: isCurrent ? Math.round(((signups / Math.max(1, (now.getTime() - start.getTime()) / DAY)) * setup.days) * 10) / 10 : null,
    });
  }
  return out;
}

const monthLabel = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Running totals for each calendar month that has any sign-ups or spend, newest first. */
export function buildMonths(setup: CycleSetup, signupTimes: Date[], spendRows: SpendRow[], now: Date): Month[] {
  const today = dayInTz(now, TZ);
  const days = new Set<string>();
  for (const t of signupTimes) days.add(dayInTz(t, TZ).slice(0, 7));
  for (const r of spendRows) {
    for (let d = r.periodStart; d <= r.periodEnd; d = addDays(d, 1)) days.add(d.slice(0, 7));
  }
  days.add(today.slice(0, 7));
  const months = Array.from(days).sort().reverse();
  // Events from before the ads (or any sign-ups) began are not counted against the goal.
  const dataDays = [...signupTimes.map((t) => dayInTz(t, TZ)), ...spendRows.map((r) => r.periodStart)].sort();
  const firstData = dataDays[0] ?? today;
  return months.map((m) => {
    const first = `${m}-01`;
    const last = addDays(`${new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 1)).toISOString().slice(0, 7)}-01`, -1);
    const events: string[] = [];
    const k0 = Math.floor((Date.parse(`${first}T00:00:00Z`) - Date.parse(`${setup.anchor}T00:00:00Z`)) / (setup.days * DAY)) - 1;
    for (let k = k0; k <= k0 + Math.ceil(31 / setup.days) + 2; k++) {
      const d = addDays(setup.anchor, k * setup.days);
      if (d >= first && d <= last && d >= firstData) events.push(d);
    }
    const signups = signupTimes.filter((t) => dayInTz(t, TZ).slice(0, 7) === m).length;
    const spend = spendBetween(spendRows, first, last);
    return {
      month: m,
      label: monthLabel(m),
      events,
      signups,
      spend,
      costPer: signups > 0 && spend > 0 ? round2(spend / signups) : null,
      goal: setup.goal ? setup.goal * events.length : null,
      current: m === today.slice(0, 7),
    };
  });
}
