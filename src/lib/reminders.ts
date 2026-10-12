// Reminders (one-off, typed in by the client). Shared by the page, the Executive Home and Daily Compass cards,
// the bell and the email cron.
export interface Reminder {
  id: string;
  title: string;
  notes: string | null;
  remind_at: string;
  status: "open" | "done";
  done_at: string | null;
  created_at: string;
}

export const REMINDER_SELECT = "id, title, notes, remind_at, status, done_at, created_at";

export const isDue = (r: Pick<Reminder, "remind_at" | "status">, now = Date.now()) => r.status === "open" && new Date(r.remind_at).getTime() <= now;

// "in 3 hours", "tomorrow at 9:00 am", "overdue by 2 days": a plain-words gap for a list row.
export function whenWords(iso: string, now = Date.now(), tz?: string): string {
  const t = new Date(iso).getTime();
  const diff = t - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60_000);
  const span = mins < 60 ? `${Math.max(1, mins)} minute${mins === 1 ? "" : "s"}` : mins < 60 * 36 ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? "" : "s"}` : `${Math.round(mins / 1440)} days`;
  const clock = new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", ...(tz ? { timeZone: tz } : {}) });
  return diff <= 0 ? `${clock} (${mins < 1 ? "now" : `${span} ago`})` : `${clock} (in ${span})`;
}
