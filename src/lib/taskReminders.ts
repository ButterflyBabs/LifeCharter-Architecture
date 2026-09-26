import { createServerClient } from "@/lib/supabase/server";

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
