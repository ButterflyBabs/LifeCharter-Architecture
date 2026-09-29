// Cadence rules for recurring tasks. Dates are plain calendar dates in the
// viewer's time zone (year, month 1-12, day) — no clock times involved.

export type Cadence = "daily" | "weekly" | "monthly";

export interface RecurringRule {
  cadence: Cadence;
  days_of_week: number[] | null;
  day_of_month: number | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Is the task due on this calendar date? A monthly task set for the 31st falls
// on the last day of shorter months, so it never silently skips a month.
export function isDueOn(rule: RecurringRule, year: number, month: number, day: number): boolean {
  if (rule.cadence === "daily") return true;
  if (rule.cadence === "weekly") {
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return (rule.days_of_week ?? []).includes(dow);
  }
  const target = Math.min(rule.day_of_month ?? 1, daysInMonth(year, month));
  return day === target;
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10] ?? "th"}`;
}

// "09:30" → "9:30 AM"
export function clockLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function scheduleLabel(rule: RecurringRule): string {
  if (rule.cadence === "daily") return "Every day";
  if (rule.cadence === "monthly") return `Monthly on the ${ordinal(rule.day_of_month ?? 1)}`;
  const days = [...(rule.days_of_week ?? [])].sort((a, b) => a - b);
  if (days.length === 7) return "Every day";
  if (days.join(",") === "1,2,3,4,5") return "Weekdays";
  if (days.join(",") === "0,6") return "Weekends";
  return days.map((d) => DAY_NAMES[d]).join(", ");
}

const PRIORITIES = ["critical", "high", "medium", "low"];

// Checks a recurring task from the add or edit form and returns the columns to save:
// { title, priority?, cadence, daysOfWeek?, dayOfMonth?, timeOfDay? (HH:MM), timeKind? }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateRecurring(body: any):
  | { error: string }
  | {
      row: {
        title: string;
        priority: string;
        cadence: Cadence;
        days_of_week: number[] | null;
        day_of_month: number | null;
        time_of_day: string | null;
        time_kind: "scheduled" | "deadline";
      };
    } {
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 255) : "";
  const cadence: Cadence | null = ["daily", "weekly", "monthly"].includes(body?.cadence) ? body.cadence : null;
  if (!title) return { error: "Give the task a title." };
  if (!cadence) return { error: "Choose how often it repeats." };

  const daysOfWeek =
    cadence === "weekly" && Array.isArray(body.daysOfWeek)
      ? (Array.from(new Set(body.daysOfWeek.map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n <= 6))) as number[])
      : null;
  if (cadence === "weekly" && (!daysOfWeek || daysOfWeek.length === 0)) return { error: "Pick at least one day of the week." };
  const dayOfMonth = cadence === "monthly" ? Math.round(Number(body.dayOfMonth)) : null;
  if (cadence === "monthly" && !(dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31)) return { error: "Pick a day of the month (1–31)." };

  const timeOfDay =
    typeof body.timeOfDay === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.timeOfDay) ? body.timeOfDay : null;

  return {
    row: {
      title,
      priority: PRIORITIES.includes(body.priority) ? body.priority : "medium",
      cadence,
      days_of_week: daysOfWeek,
      day_of_month: dayOfMonth,
      time_of_day: timeOfDay,
      time_kind: body.timeKind === "scheduled" ? "scheduled" : "deadline",
    },
  };
}
