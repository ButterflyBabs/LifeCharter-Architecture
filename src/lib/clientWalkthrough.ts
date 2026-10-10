import { createServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail, welcomeEmailsEnabled } from "@/lib/email/welcomeSequence";

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
  const on = (await setting(db, "client_walkthrough_on")).toLowerCase() === "true" && welcomeEmailsEnabled();
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
    const ok = await sendWelcomeEmail(db as never, { userId: prof.id as string, email: row.email, name: row.name || (prof.full_name as string | null), planId: (prof.current_plan_id as string | null) ?? null, enrolledAt: new Date().toISOString() }, "welcome");
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
