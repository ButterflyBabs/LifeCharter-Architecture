import { createServerClient } from "@/lib/supabase/server";
import { nowParts } from "@/lib/finance/period";
import { isDueOn, type RecurringRule } from "@/lib/recurring";
import { zonedToUtcISO } from "@/lib/tz";

export const REMINDER_LEADS = [10, 15, 30, 60, 120] as const;
export const DEFAULT_LEAD_MIN = 30;

// How far ahead of a timed task's due moment this client wants to be reminded.
export async function reminderLeadFor(masterPlanId: string): Promise<number> {
  try {
    const supabase = createServerClient();
    const { data: plan } = await supabase.from("client_master_plans").select("user_id").eq("id", masterPlanId).maybeSingle();
    if (!plan?.user_id) return DEFAULT_LEAD_MIN;
    const { data: prof } = await supabase.from("profiles").select("task_reminder_lead_min").eq("id", plan.user_id).maybeSingle();
    const lead = Number(prof?.task_reminder_lead_min);
    return (REMINDER_LEADS as readonly number[]).includes(lead) ? lead : DEFAULT_LEAD_MIN;
  } catch {
    return DEFAULT_LEAD_MIN;
  }
}

export function minutesUntil(iso: string, now: Date = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 60000);
}

export function inMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// ── Timed recurring tasks ────────────────────────────────────────────────────
// The zone to read a client's "today" in when no one is signed in (crons, the
// bell): the one they chose, else the profile default.
export async function ownerTimezone(masterPlanId: string): Promise<string> {
  try {
    const supabase = createServerClient();
    const { data: plan } = await supabase.from("client_master_plans").select("user_id").eq("id", masterPlanId).maybeSingle();
    if (!plan?.user_id) return "America/Denver";
    const { data: prof } = await supabase.from("profiles").select("timezone").eq("id", plan.user_id).maybeSingle();
    return (prof?.timezone as string) || "America/Denver";
  } catch {
    return "America/Denver";
  }
}

export interface DueRecurring {
  id: string;
  title: string;
  dueAt: string; // today's due moment as a UTC instant
  timeKind: "deadline" | "scheduled";
  today: string; // YYYY-MM-DD in the client's zone
}

// Timed recurring tasks that are due today for this plan, not yet checked off
// today, and whose moment is still ahead of `now`.
export async function upcomingRecurringToday(masterPlanId: string, tz: string, now: Date = new Date()): Promise<DueRecurring[]> {
  const supabase = createServerClient();
  const { year, month, day } = nowParts(tz);
  const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const { data } = await supabase
    .from("recurring_tasks")
    .select("id, title, cadence, days_of_week, day_of_month, time_of_day, time_kind")
    .eq("master_plan_id", masterPlanId)
    .not("time_of_day", "is", null);
  const rows = ((data ?? []) as (RecurringRule & { id: string; title: string; time_of_day: string; time_kind: string })[]).filter((r) =>
    isDueOn(r, year, month, day)
  );
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { data: done } = await supabase.from("recurring_task_completions").select("recurring_task_id").eq("done_on", today).in("recurring_task_id", ids);
  const doneIds = new Set((done ?? []).map((d) => d.recurring_task_id as string));
  return rows
    .filter((r) => !doneIds.has(r.id))
    .map((r) => ({
      id: r.id,
      title: r.title,
      dueAt: zonedToUtcISO(today, r.time_of_day, tz),
      timeKind: (r.time_kind === "scheduled" ? "scheduled" : "deadline") as "deadline" | "scheduled",
      today,
    }))
    .filter((r) => new Date(r.dueAt).getTime() > now.getTime());
}
