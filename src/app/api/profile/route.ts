import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { readAccountKey, resolveAiAccount } from "@/lib/ai/config";
import { isValidTimeZone } from "@/lib/timezones";
import { REMINDER_LEADS, DEFAULT_LEAD_MIN } from "@/lib/taskReminders";
import { DEFAULT_ASSISTANT_NAME } from "@/lib/ai/defaults";

export const dynamic = "force-dynamic";

// Returns the signed-in account's display name for the greeting plus the AI
// assistant name and whether its own OpenAI key is configured. The key itself
// is never returned.
export async function GET() {
  const { profileId } = await resolveAiAccount();
  const { data } = profileId
    ? await createServerClient().from("profiles").select("full_name, assistant_name, avatar_url, timezone, timezone_chosen, task_reminder_email, task_reminder_lead_min").eq("id", profileId).maybeSingle()
    : { data: null };
  const fullName = ((data?.full_name as string) || "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";
  const assistantName = ((data?.assistant_name as string) || "").trim() || DEFAULT_ASSISTANT_NAME;
  const hasOpenAiKey = Boolean(await readAccountKey(profileId));
  const avatarUrl = ((data?.avatar_url as string) || "").trim() || null;
  const timezone = data?.timezone_chosen ? ((data?.timezone as string) || "").trim() || null : null;
  const taskReminderEmail = data?.task_reminder_email !== false;
  const taskReminderLeadMin = Number(data?.task_reminder_lead_min) || DEFAULT_LEAD_MIN;
  return NextResponse.json({ fullName, firstName, assistantName, hasOpenAiKey, avatarUrl, timezone, taskReminderEmail, taskReminderLeadMin });
}

// Saves the signed-in owner's settings: the time zone they chose (dashboard
// clock, greeting, schedule) and their task-reminder preferences. Team members
// keep theirs in their browser. Send any subset of
// { timezone, taskReminderEmail, taskReminderLeadMin }.
export async function PATCH(req: Request) {
  const { profileId, canEdit } = await resolveAiAccount();
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (body.timezone !== undefined) {
    const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
    if (!timezone || !isValidTimeZone(timezone)) return NextResponse.json({ error: "Invalid time zone" }, { status: 400 });
    update.timezone = timezone;
    update.timezone_chosen = true;
  }
  if (body.taskReminderEmail !== undefined) update.task_reminder_email = Boolean(body.taskReminderEmail);
  if (body.taskReminderLeadMin !== undefined) {
    const lead = Number(body.taskReminderLeadMin);
    if (!(REMINDER_LEADS as readonly number[]).includes(lead)) {
      return NextResponse.json({ error: "Choose 10, 15, 30, 60 or 120 minutes." }, { status: 400 });
    }
    update.task_reminder_lead_min = lead;
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });

  if (!profileId || !canEdit) return NextResponse.json({ ok: true, saved: false });
  const { error } = await createServerClient().from("profiles").update(update).eq("id", profileId);
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  return NextResponse.json({ ok: true, saved: true });
}
