// Time tracking and capacity (task 1154). Pure helpers shared by the Time page and its API.

export interface Entry { started_at: string; ended_at: string | null; billable: boolean; rate: number | null; contact_id: string | null; project_id: string | null }

/** Minutes in an entry (a running timer counts up to now). */
export const minutesOf = (e: Pick<Entry, "started_at" | "ended_at">, now = Date.now()) =>
  Math.max(0, Math.round(((e.ended_at ? Date.parse(e.ended_at) : now) - Date.parse(e.started_at)) / 60_000));

/** "2 h 05 m" style. */
export const hm = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} m`;

/** Monday 00:00 of the week containing `d`, in the viewer's local time, as a Date. */
export function weekStart(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

/** Totals for a list of entries: all minutes, billable minutes and the billable amount. */
export function totals(entries: Entry[], now = Date.now()) {
  let min = 0;
  let billMin = 0;
  let amount = 0;
  for (const e of entries) {
    const m = minutesOf(e, now);
    min += m;
    if (e.billable) {
      billMin += m;
      if (e.rate) amount += (m / 60) * Number(e.rate);
    }
  }
  return { min, billMin, amount: Math.round(amount * 100) / 100 };
}
