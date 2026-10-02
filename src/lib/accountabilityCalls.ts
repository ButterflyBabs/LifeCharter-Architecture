// Calls between accountability partners: a standing recurring time and quick one-off
// calls. A call is stored as a local date + clock time + the proposer's timezone, so a
// weekly "Fridays at 4:00" stays at 4:00 through daylight saving; everyone sees it in
// their own zone (the page converts) and gets a calendar file that does the same.

export interface CallRow {
  id: string;
  partnership_id: string;
  kind: "recurring" | "one_off";
  title: string;
  starts_on: string; // YYYY-MM-DD in tz
  local_time: string; // HH:MM in tz
  tz: string;
  duration_min: number;
  recur_freq: "weekly" | "biweekly" | null;
  recur_days: number[] | null; // 0 = Sunday .. 6 = Saturday
  location: string | null;
  note: string | null;
  proposed_by: "a" | "b";
  status: "proposed" | "confirmed" | "declined" | "canceled";
  skips: string[];
}
export interface Occurrence {
  localDate: string;
  start: Date;
  end: Date;
}

export const validTz = (tz: unknown): string => {
  if (typeof tz !== "string" || !tz) return "America/Denver";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "America/Denver";
  }
};

const pad = (n: number) => String(n).padStart(2, "0");

const partsIn = (d: Date, tz: string) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour) % 24, mi: Number(p.minute) };
};

export function zonedToUtc(ymd: string, hm: string, tz: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  const want = Date.UTC(y, m - 1, d, h, mi);
  let guess = want;
  for (let i = 0; i < 2; i++) {
    const p = partsIn(new Date(guess), tz);
    guess += want - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
  }
  return new Date(guess);
}

export const localDateOf = (d: Date, tz: string): string => {
  const p = partsIn(d, tz);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
};
const addDays = (ymd: string, n: number): string => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekdayOf = (ymd: string) => new Date(`${ymd}T12:00:00Z`).getUTCDay();
const mondayOf = (ymd: string) => addDays(ymd, -((weekdayOf(ymd) + 6) % 7));
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

// Upcoming occurrences that haven't ended yet (so a call in progress still counts).
export function occurrences(c: CallRow, from: Date, count = 3, horizonDays = 140): Occurrence[] {
  const out: Occurrence[] = [];
  const end = (start: Date) => new Date(start.getTime() + c.duration_min * 60_000);
  if (c.kind === "one_off") {
    const start = zonedToUtc(c.starts_on, c.local_time, c.tz);
    return end(start) > from ? [{ localDate: c.starts_on, start, end: end(start) }] : [];
  }
  const days = (c.recur_days || []).map(Number);
  if (!days.length) return out;
  const first = mondayOf(c.starts_on);
  let day = addDays(localDateOf(from, c.tz), -1);
  for (let i = 0; i < horizonDays && out.length < count; i++, day = addDays(day, 1)) {
    if (day < c.starts_on || !days.includes(weekdayOf(day))) continue;
    if (c.recur_freq === "biweekly" && Math.floor(daysBetween(first, mondayOf(day)) / 7) % 2 !== 0) continue;
    if (c.skips.includes(day)) continue;
    const start = zonedToUtc(day, c.local_time, c.tz);
    if (end(start) > from) out.push({ localDate: day, start, end: end(start) });
  }
  return out;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function describe(c: CallRow): string {
  const [h, m] = c.local_time.split(":").map(Number);
  const time = `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
  if (c.kind === "one_off") return `${new Date(`${c.starts_on}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })} at ${time} (${c.tz.replace(/_/g, " ")})`;
  const days = [...(c.recur_days || [])].sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(" and ");
  return `${c.recur_freq === "biweekly" ? "Every other " : "Every "}${days || "week"} at ${time} (${c.tz.replace(/_/g, " ")})`;
}

// ---- calendar files

const icsEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => (line.length <= 74 ? line : line.match(/.{1,73}/g)!.join("\r\n "));
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const localStamp = (ymd: string, hm: string) => `${ymd.replace(/-/g, "")}T${hm.replace(":", "")}00`;
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function icsFor(c: CallRow, withName: string): { filename: string; text: string } {
  const occ = occurrences({ ...c, skips: [] }, new Date(zonedToUtc(c.starts_on, "00:00", c.tz).getTime() - 86_400_000), 1)[0];
  const first = occ ? occ.localDate : c.starts_on;
  const endHm = (() => {
    const [h, m] = c.local_time.split(":").map(Number);
    const t = h * 60 + m + c.duration_min;
    return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
  })();
  const url = c.location && /^https?:\/\//i.test(c.location) ? c.location : "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LifeCharter Command Suite//Accountability//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${c.id}@lccommandsuite.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;TZID=${c.tz}:${localStamp(first, c.local_time)}`,
    `DTEND;TZID=${c.tz}:${localStamp(first, endHm)}`,
    `SUMMARY:${icsEsc(`${c.title} with ${withName}`)}`,
  ];
  if (c.kind === "recurring" && c.recur_days?.length) lines.push(`RRULE:FREQ=WEEKLY;INTERVAL=${c.recur_freq === "biweekly" ? 2 : 1};BYDAY=${[...c.recur_days].sort((a, b) => a - b).map((d) => BYDAY[d]).join(",")}`);
  for (const s of c.skips) lines.push(`EXDATE;TZID=${c.tz}:${localStamp(s, c.local_time)}`);
  const desc = [c.note, c.location].filter(Boolean).join("\n");
  if (desc) lines.push(`DESCRIPTION:${icsEsc(desc)}`);
  if (c.location) lines.push(`LOCATION:${icsEsc(c.location)}`);
  if (url) lines.push(`URL:${url}`);
  lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(`${c.title} with ${withName} starts soon`)}`, "TRIGGER:-PT10M", "END:VALARM", "END:VEVENT", "END:VCALENDAR");
  return { filename: "accountability-call.ics", text: lines.map(fold).join("\r\n") + "\r\n" };
}

export function googleLink(c: CallRow, withName: string): string {
  const occ = occurrences({ ...c, skips: [] }, new Date(zonedToUtc(c.starts_on, "00:00", c.tz).getTime() - 86_400_000), 1)[0];
  const start = occ ? occ.start : zonedToUtc(c.starts_on, c.local_time, c.tz);
  const end = new Date(start.getTime() + c.duration_min * 60_000);
  const q = new URLSearchParams({ action: "TEMPLATE", text: `${c.title} with ${withName}`, dates: `${stamp(start)}/${stamp(end)}`, ctz: c.tz });
  if (c.location) q.set("location", c.location);
  if (c.note) q.set("details", c.note);
  if (c.kind === "recurring" && c.recur_days?.length) q.set("recur", `RRULE:FREQ=WEEKLY;INTERVAL=${c.recur_freq === "biweekly" ? 2 : 1};BYDAY=${[...c.recur_days].sort((a, b) => a - b).map((d) => BYDAY[d]).join(",")}`);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
