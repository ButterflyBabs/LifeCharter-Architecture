import { dayInTz } from "@/lib/tz";
import { resolveUserTimeZone } from "@/lib/userTimezone";

// The calendar day (YYYY-MM-DD) a task was put on Today by hand: the day the page sent from the person's own clock,
// otherwise today in the account's own time zone. The Tasks page shows a task in Today when it is dated today or
// was put there today, so the list starts fresh each day.
export async function todayOnFrom(sent: unknown): Promise<string> {
  if (typeof sent === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sent)) return sent;
  return dayInTz(new Date(), await resolveUserTimeZone());
}
