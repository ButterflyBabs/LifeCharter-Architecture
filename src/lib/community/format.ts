export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: d > 300 ? "numeric" : undefined });
}

export function initials(name: string | null | undefined): string {
  const parts = (name || "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// The last calendar day an event touches, in the viewer's time zone. An end
// at exactly midnight belongs to the day before (a Summit ending 12:00 AM
// Sunday runs through Saturday).
export function lastDay(start: Date, end: Date): Date {
  const e = new Date(end.getTime() - 1);
  return e < start ? start : e;
}

// True when a session runs across more than one calendar day.
export function isMultiDay(start: Date, end: Date | null | undefined): boolean {
  return !!end && lastDay(start, end).toDateString() !== start.toDateString();
}

// "Oct 8–10", "Oct 30 – Nov 2", "Dec 30, 2026 – Jan 2, 2027".
export function dayRange(start: Date, end: Date): string {
  const last = lastDay(start, end);
  const md: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (last.getFullYear() !== start.getFullYear()) {
    const y: Intl.DateTimeFormatOptions = { ...md, year: "numeric" };
    return `${start.toLocaleDateString(undefined, y)} – ${last.toLocaleDateString(undefined, y)}`;
  }
  if (last.getMonth() === start.getMonth()) return `${start.toLocaleDateString(undefined, md)}–${last.getDate()}`;
  return `${start.toLocaleDateString(undefined, md)} – ${last.toLocaleDateString(undefined, md)}`;
}

// Every calendar day (local midnight) a session covers, first to last.
export function daysCovered(start: Date, end: Date, max = 31): Date[] {
  const out: Date[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = lastDay(start, end);
  const stop = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  while (d.getTime() <= stop && out.length < max) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Shown in the viewer's own time zone, labelled so members elsewhere aren't confused.
// Multi-day events read "Oct 8–10 · Thu 9:00 AM – Sat 5:00 PM MDT".
export function eventWhen(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;
  const zone = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(start).find((p) => p.type === "timeZoneName")?.value;
  let out: string;
  if (end && isMultiDay(start, end)) {
    const wt: Intl.DateTimeFormatOptions = { weekday: "short", hour: "numeric", minute: "2-digit" };
    out = `${dayRange(start, end)} · ${start.toLocaleString(undefined, wt)} – ${end.toLocaleString(undefined, wt)}`;
  } else {
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
    out = start.toLocaleString(undefined, opts);
    if (end) out += " – " + end.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return zone ? `${out} ${zone}` : out;
}

// Compact label for small cards: "Thu, Oct 8, 9:00 AM" or "Oct 8–10".
export function eventWhenShort(start: Date, end: Date): string {
  if (isMultiDay(start, end)) return dayRange(start, end);
  return start.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Split text into plain and link segments so URLs render as anchors without
// ever injecting HTML.
export function linkify(text: string): { text: string; href?: string }[] {
  const out: { text: string; href?: string }[] = [];
  const re = /\bhttps?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], href: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
