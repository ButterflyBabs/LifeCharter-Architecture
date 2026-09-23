// Recurring events for the Collective. An event row is the first session plus
// a rule; occurrences are expanded on the fly (in the event's own time zone,
// so a 1:00 PM session stays at 1:00 PM across daylight-saving changes).
// Shared by the browser (calendar, lists) and the server (reminder cron).

export type RecurFreq = "daily" | "weekdays" | "weekly" | "biweekly" | "monthly_date" | "monthly_weekday";

export interface RecurringEventFields {
  id: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  recur_freq: RecurFreq | null;
  recur_until: string | null; // YYYY-MM-DD, inclusive, in the event's time zone
  recur_exdates: string[] | null; // YYYY-MM-DD dates that are skipped
}

export interface Occurrence<E> {
  event: E;
  start: Date;
  end: Date;
  date: string; // YYYY-MM-DD in the event's time zone
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];
const DEFAULT_MINUTES = 60;

interface LocalParts {
  y: number;
  m: number; // 1-12
  d: number;
  h: number;
  mi: number;
}

function partsIn(date: Date, timeZone: string): LocalParts {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute };
}

// The UTC instant at which the wall clock in `timeZone` reads y-m-d h:mi.
export function zonedToUtc(y: number, m: number, d: number, h: number, mi: number, timeZone: string): Date {
  const target = Date.UTC(y, m - 1, d, h, mi);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = partsIn(new Date(guess), timeZone);
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    const diff = target - seen;
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const dow = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

// Every occurrence of `event` that overlaps [from, to), capped at `max`.
export function occurrences<E extends RecurringEventFields>(event: E, from: Date, to: Date, max = 400): Occurrence<E>[] {
  const first = new Date(event.starts_at);
  const durMs = Math.max(0, (event.ends_at ? new Date(event.ends_at).getTime() : first.getTime() + DEFAULT_MINUTES * 60_000) - first.getTime());
  const tz = event.timezone || "America/Denver";
  const local = partsIn(first, tz);
  const make = (y: number, m: number, d: number): Occurrence<E> => {
    const start = zonedToUtc(y, m, d, local.h, local.mi, tz);
    return { event, start, end: new Date(start.getTime() + durMs), date: iso(y, m, d) };
  };

  if (!event.recur_freq) {
    const o = make(local.y, local.m, local.d);
    return o.end > from && o.start < to ? [o] : [];
  }

  const skip = new Set(event.recur_exdates ?? []);
  const until = event.recur_until ?? "9999-12-31";
  const out: Occurrence<E>[] = [];
  const nth = Math.ceil(local.d / 7);
  const weekday = dow(local.y, local.m, local.d);

  const consider = (y: number, m: number, d: number): boolean => {
    const date = iso(y, m, d);
    if (date > until) return false; // series is over
    const o = make(y, m, d);
    if (o.start >= to) return false;
    if (o.end > from && !skip.has(date)) out.push(o);
    return out.length < max;
  };

  if (event.recur_freq === "monthly_date" || event.recur_freq === "monthly_weekday") {
    for (let i = 0; i < 1200; i++) {
      const y = local.y + Math.floor((local.m - 1 + i) / 12);
      const m = ((local.m - 1 + i) % 12) + 1;
      let d: number | null;
      if (event.recur_freq === "monthly_date") {
        d = local.d <= daysIn(y, m) ? local.d : null;
      } else {
        const firstDow = dow(y, m, 1);
        const cand = 1 + ((weekday - firstDow + 7) % 7) + (nth - 1) * 7;
        d = cand <= daysIn(y, m) ? cand : null;
      }
      if (d === null) continue;
      if (!consider(y, m, d)) break;
    }
    return out;
  }

  const step = event.recur_freq === "weekly" ? 7 : event.recur_freq === "biweekly" ? 14 : 1;
  // Jump close to `from` instead of walking from the very first session.
  let offset = 0;
  const gapDays = Math.floor((from.getTime() - first.getTime()) / 86_400_000) - 2;
  if (gapDays > step) offset = Math.floor(gapDays / step) * step;
  for (let i = 0; i < 20000; i++, offset += step) {
    const day = new Date(Date.UTC(local.y, local.m - 1, local.d + offset));
    const y = day.getUTCFullYear();
    const m = day.getUTCMonth() + 1;
    const d = day.getUTCDate();
    if (event.recur_freq === "weekdays" && (day.getUTCDay() === 0 || day.getUTCDay() === 6)) {
      if (iso(y, m, d) > until) break;
      continue;
    }
    if (!consider(y, m, d)) break;
  }
  return out;
}

// The next session that hasn't finished yet, or null if the series is over.
export function nextOccurrence<E extends RecurringEventFields>(event: E, now = new Date()): Occurrence<E> | null {
  return occurrences(event, now, new Date(now.getTime() + 800 * 86_400_000), 1)[0] ?? null;
}

// "Every Thursday", "Every 2nd Tuesday of the month", … (+ " until Dec 31").
export function describeRule(e: Pick<RecurringEventFields, "starts_at" | "timezone" | "recur_freq" | "recur_until">): string | null {
  if (!e.recur_freq) return null;
  const p = partsIn(new Date(e.starts_at), e.timezone || "America/Denver");
  const wd = WEEKDAY_NAMES[dow(p.y, p.m, p.d)];
  const base: Record<RecurFreq, string> = {
    daily: "Every day",
    weekdays: "Every weekday",
    weekly: `Every ${wd}`,
    biweekly: `Every other ${wd}`,
    monthly_date: `Monthly on the ${p.d}${[, "st", "nd", "rd"][p.d % 10 > 3 || Math.floor(p.d / 10) === 1 ? 0 : p.d % 10] || "th"}`,
    monthly_weekday: `Every ${ORDINALS[Math.ceil(p.d / 7) - 1]} ${wd} of the month`,
  };
  let label = base[e.recur_freq];
  if (e.recur_until) {
    const [y, m, d] = e.recur_until.split("-").map(Number);
    label += ` until ${new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: y !== p.y ? "numeric" : undefined, timeZone: "UTC" })}`;
  }
  return label;
}

// The choices offered in the event form, worded for the chosen start date.
export function ruleChoices(startLocalIso: string): { value: RecurFreq | ""; label: string }[] {
  const [datePart] = startLocalIso.split("T");
  const [y, m, d] = (datePart || "").split("-").map(Number);
  if (!y || !m || !d) return [{ value: "", label: "Does not repeat" }];
  const wd = WEEKDAY_NAMES[dow(y, m, d)];
  const nth = Math.ceil(d / 7);
  return [
    { value: "", label: "Does not repeat" },
    { value: "daily", label: "Every day" },
    { value: "weekdays", label: "Every weekday (Mon–Fri)" },
    { value: "weekly", label: `Every week on ${wd}` },
    { value: "biweekly", label: `Every 2 weeks on ${wd}` },
    { value: "monthly_date", label: `Monthly on day ${d}` },
    ...(nth <= 4 ? [{ value: "monthly_weekday" as RecurFreq, label: `Monthly on the ${ORDINALS[nth - 1]} ${wd}` }] : []),
  ];
}

// RRULE for "Add to calendar" so the whole series lands in Google/Apple Calendar.
export function rrule(e: Pick<RecurringEventFields, "starts_at" | "timezone" | "recur_freq" | "recur_until">): string | null {
  if (!e.recur_freq) return null;
  const p = partsIn(new Date(e.starts_at), e.timezone || "America/Denver");
  const day = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][dow(p.y, p.m, p.d)];
  const rules: Record<RecurFreq, string> = {
    daily: "FREQ=DAILY",
    weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    weekly: `FREQ=WEEKLY;BYDAY=${day}`,
    biweekly: `FREQ=WEEKLY;INTERVAL=2;BYDAY=${day}`,
    monthly_date: `FREQ=MONTHLY;BYMONTHDAY=${p.d}`,
    monthly_weekday: `FREQ=MONTHLY;BYDAY=${Math.ceil(p.d / 7)}${day}`,
  };
  let r = `RRULE:${rules[e.recur_freq]}`;
  if (e.recur_until) r += `;UNTIL=${e.recur_until.replace(/-/g, "")}T235959Z`;
  return r;
}

// Local wall-clock string for an ICS DTSTART;TZID=… line.
export function icsLocal(date: Date, timeZone: string): string {
  const p = partsIn(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}${pad(p.m)}${pad(p.d)}T${pad(p.h)}${pad(p.mi)}00`;
}
