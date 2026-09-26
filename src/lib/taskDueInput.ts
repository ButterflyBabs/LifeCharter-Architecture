import { resolveUserTimeZone } from "@/lib/userTimezone";
import { zonedToUtcISO } from "@/lib/tz";

export interface DueUpdate {
  due_at: string | null;
  due_has_time: boolean;
  time_kind?: "deadline" | "scheduled";
  reminded_at: null; // a changed due time gets a fresh reminder
}

// Turns a request's due fields into the columns to store, or null when the
// request doesn't touch the due date at all. Accepts:
//   { clearDue: true }                              → remove it
//   { dueDay: "YYYY-MM-DD", dueTime?: "HH:MM",      → due that day (end of day when
//     timeKind?: "deadline"|"scheduled", tz? }         no time), in the user's zone
export async function dueFromBody(body: Record<string, unknown>): Promise<DueUpdate | null | "invalid"> {
  if (body.clearDue) return { due_at: null, due_has_time: false, time_kind: "deadline", reminded_at: null };
  if (body.dueDay === undefined) return null;
  const day = typeof body.dueDay === "string" ? body.dueDay : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "invalid";
  const time = typeof body.dueTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.dueTime) ? body.dueTime : null;
  const tz = await resolveUserTimeZone(typeof body.tz === "string" ? body.tz : null);
  return {
    due_at: zonedToUtcISO(day, time ?? "23:59", tz),
    due_has_time: Boolean(time),
    time_kind: body.timeKind === "scheduled" ? "scheduled" : "deadline",
    reminded_at: null,
  };
}
