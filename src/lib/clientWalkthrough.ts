import { createServerClient } from "@/lib/supabase/server";
import { clientSetupState, sendWelcomeEmail, welcomeSeriesPaused } from "@/lib/email/welcomeSequence";

type Db = ReturnType<typeof createServerClient>;

// Email 1 of LCCS New Client Welcome is the New Client Setup Walkthrough (copy in welcomeContent.ts, editable
// in Campaigns & Broadcasts > LCCS New Client Welcome). It goes to every new client account about 3 minutes
// after the account is created: each address is queued once (unique), a once-a-minute job sends it through the
// welcome pipeline (so a person can never get it twice), and one that is more than 30 minutes late is skipped,
// never sent as a surprise. app_settings client_walkthrough_on = "false" pauses the sends (rows keep waiting
// until they are too late).
export const WALKTHROUGH_DELAY_MS = 3 * 60_000;
export const WALKTHROUGH_MAX_LATE_MS = 30 * 60_000;

export const isTooLate = (dueAt: string | Date, now = Date.now()) => now - new Date(dueAt).getTime() > WALKTHROUGH_MAX_LATE_MS;

export async function queueClientWalkthrough(db: Db, i: { email: string; userId?: string | null; name?: string | null }): Promise<void> {
  try {
    await db.from("client_walkthrough_queue").upsert(
      { email: i.email.trim().toLowerCase(), user_id: i.userId ?? null, name: i.name ?? null, due_at: new Date(Date.now() + WALKTHROUGH_DELAY_MS).toISOString() },
      { onConflict: "email", ignoreDuplicates: true }
    );
  } catch (e) {
    console.error("client walkthrough queue:", (e as Error).message); // never blocks account creation
  }
}

async function setting(db: Db, key: string): Promise<string> {
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  return String(data?.value ?? "").trim();
}

export async function sendDueWalkthroughs(db: Db): Promise<{ on: boolean; sent: number; skipped: number; failed: number }> {
  const on = (await setting(db, "client_walkthrough_on")).toLowerCase() === "true" && !(await welcomeSeriesPaused(db as never));
  if (!on) return { on, sent: 0, skipped: 0, failed: 0 };
  const { data: due } = await db
    .from("client_walkthrough_queue")
    .select("id, email, name, due_at")
    .is("sent_at", null)
    .is("skipped_reason", null)
    .lte("due_at", new Date().toISOString())
    .order("due_at")
    .limit(25);
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of (due ?? []) as { id: string; email: string; name: string | null; due_at: string }[]) {
    if (isTooLate(row.due_at)) {
      await db.from("client_walkthrough_queue").update({ skipped_reason: "late" }).eq("id", row.id);
      skipped++;
      continue;
    }
    const { data: prof } = await db.from("profiles").select("id, current_plan_id, full_name").eq("email", row.email).maybeSingle();
    if (!prof) {
      await db.from("client_walkthrough_queue").update({ skipped_reason: "no account" }).eq("id", row.id);
      skipped++;
      continue;
    }
    const { data: already } = await db.from("lccs_welcome_log").select("user_id").eq("user_id", prof.id).eq("email_key", "welcome").maybeSingle();
    if (already) {
      await db.from("client_walkthrough_queue").update({ skipped_reason: "already sent" }).eq("id", row.id);
      skipped++;
      continue;
    }
    // Claim the queue row first so two overlapping runs can't both send.
    const { data: claim } = await db.from("client_walkthrough_queue").update({ sent_at: new Date().toISOString(), result: "sending" }).eq("id", row.id).is("sent_at", null).select("id");
    if (!claim?.length) continue;
    const ok = await sendWelcomeEmail(db as never, { userId: prof.id as string, email: row.email, name: row.name || (prof.full_name as string | null), planId: (prof.current_plan_id as string | null) ?? null, enrolledAt: new Date().toISOString() }, "welcome", { ignoreEnvSwitch: true });
    if (ok) {
      sent++;
      await db.from("client_walkthrough_queue").update({ result: "sent" }).eq("id", row.id);
    } else {
      failed++;
      await db.from("client_walkthrough_queue").update({ sent_at: null, result: "failed; will retry" }).eq("id", row.id);
    }
  }
  return { on, sent, skipped, failed };
}

// The "why your assessment answers matter" email: about 1 hour after the account is created (between the 3-minute
// walkthrough and Day 3). The same once-a-minute job sends it. Rules: only while app_settings
// welcome_assessments_on = "true" (Babs approves the copy first); never to someone who has already finished
// all three assessments (recorded as held back, so it is not re-checked every minute); never more than 3 hours
// late; and the welcome log makes a second send impossible.
export const ASSESSMENT_EMAIL_DELAY_MS = 60 * 60_000;
export const ASSESSMENT_EMAIL_MAX_LATE_MS = 3 * 60 * 60_000;

/** "due": send now; "early": not yet; "late": the window passed. */
export function assessmentEmailWindow(joinedAt: string | Date, now = Date.now()): "early" | "due" | "late" {
  const age = now - new Date(joinedAt).getTime();
  if (age < ASSESSMENT_EMAIL_DELAY_MS) return "early";
  if (age > ASSESSMENT_EMAIL_DELAY_MS + ASSESSMENT_EMAIL_MAX_LATE_MS) return "late";
  return "due";
}

export async function sendDueAssessmentEmails(db: Db): Promise<{ on: boolean; sent: number; held: number }> {
  const on = (await setting(db, "welcome_assessments_on")).toLowerCase() === "true" && !(await welcomeSeriesPaused(db as never));
  if (!on) return { on, sent: 0, held: 0 };
  const now = Date.now();
  const { data: rows } = await db
    .from("client_walkthrough_queue")
    .select("email, name, created_at")
    .lte("created_at", new Date(now - ASSESSMENT_EMAIL_DELAY_MS).toISOString())
    .gte("created_at", new Date(now - ASSESSMENT_EMAIL_DELAY_MS - ASSESSMENT_EMAIL_MAX_LATE_MS).toISOString())
    .order("created_at")
    .limit(25);
  let sent = 0;
  let held = 0;
  for (const row of (rows ?? []) as { email: string; name: string | null; created_at: string }[]) {
    const { data: prof } = await db.from("profiles").select("id, current_plan_id, full_name").eq("email", row.email).maybeSingle();
    if (!prof) continue;
    const { data: already } = await db.from("lccs_welcome_log").select("user_id").eq("user_id", prof.id).eq("email_key", "assessments").maybeSingle();
    if (already) continue;
    const { data: plan } = await db.from("client_master_plans").select("id").eq("user_id", prof.id).order("created_at").limit(1).maybeSingle();
    if (plan?.id) {
      const state = await clientSetupState(db as never, prof.id as string, plan.id as string).catch(() => null);
      if (state?.assessments) {
        // Already done all three: nothing to nudge. Recorded as held back so it is not looked at again.
        await db.from("lccs_welcome_log").upsert({ user_id: prof.id, email_key: "assessments", stopped: true }, { onConflict: "user_id,email_key", ignoreDuplicates: true });
        held++;
        continue;
      }
    }
    const ok = await sendWelcomeEmail(
      db as never,
      { userId: prof.id as string, email: row.email, name: row.name || (prof.full_name as string | null), planId: (prof.current_plan_id as string | null) ?? null, enrolledAt: row.created_at },
      "assessments",
      { ignoreEnvSwitch: true }
    );
    if (ok) sent++;
  }
  return { on, sent, held };
}
