import { dayInTz, timeInTz } from "@/lib/tz";

export interface DueFields {
  status?: string;
  due_at?: string | null;
  due_has_time?: boolean | null;
  time_kind?: "deadline" | "scheduled" | string | null;
}

export type DueTone = "overdue" | "today" | "soon" | "later";

// How a task's due date/time reads on a card, in the viewer's time zone.
export function dueInfo(t: DueFields, timeZone: string, now: Date = new Date()): { label: string; tone: DueTone } | null {
  if (!t.due_at) return null;
  const due = new Date(t.due_at);
  const hasTime = Boolean(t.due_has_time);
  const scheduled = t.time_kind === "scheduled";
  const dueDay = dayInTz(due, timeZone);
  const today = dayInTz(now, timeZone);
  const time = hasTime ? timeInTz(due, timeZone) : "";
  const overdue = t.status !== "done" && due.getTime() < now.getTime();

  const dayLabel =
    dueDay === today
      ? "today"
      : new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" }).format(due);

  if (overdue) {
    return { label: hasTime ? `Overdue · ${dueDay === today ? "" : dayLabel + " "}${time}`.trim() : `Overdue · ${dayLabel}`, tone: "overdue" };
  }
  if (dueDay === today) {
    if (!hasTime) return { label: "Due today", tone: "today" };
    const soon = due.getTime() - now.getTime() <= 60 * 60 * 1000;
    return { label: scheduled ? `At ${time}` : `Due by ${time}`, tone: soon ? "soon" : "today" };
  }
  return { label: hasTime ? `${dayLabel} · ${time}` : dayLabel, tone: "later" };
}

export const TONE_CLASS: Record<DueTone, string> = {
  overdue: "bg-[#FBECEA] text-[#B0342C]",
  soon: "bg-[#FBF2DE] text-[#9A6B12]",
  today: "bg-[#E6EFF6] text-[#2B5F8A]",
  later: "bg-gray-100 text-gray-500",
};
