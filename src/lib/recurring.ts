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

export function scheduleLabel(rule: RecurringRule): string {
  if (rule.cadence === "daily") return "Every day";
  if (rule.cadence === "monthly") return `Monthly on the ${ordinal(rule.day_of_month ?? 1)}`;
  const days = [...(rule.days_of_week ?? [])].sort((a, b) => a - b);
  if (days.length === 7) return "Every day";
  if (days.join(",") === "1,2,3,4,5") return "Weekdays";
  if (days.join(",") === "0,6") return "Weekends";
  return days.map((d) => DAY_NAMES[d]).join(", ");
}
