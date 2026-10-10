import { createServerClient } from "@/lib/supabase/server";
import { renderStep } from "@/lib/sequences/render";
import { sendRendered } from "@/lib/sequences/engine";
import { logEvent, upsertContact } from "@/lib/crm";

type Db = ReturnType<typeof createServerClient>;

// The "New Client Setup Walkthrough" email (the Client Care section of Campaigns & Broadcasts) goes to every
// new client about 3 minutes after their account is created. The wording is the broadcast row named in
// app_settings client_walkthrough_broadcast_id, so it is edited where Babs already edits email. It stays OFF
// until app_settings client_walkthrough_on = "true". Each address is queued once (unique), and a queued email
// that is more than 30 minutes late (the switch was off, or an outage) is skipped, never sent as a surprise.
export const WALKTHROUGH_DELAY_MS = 3 * 60_000;
export const WALKTHROUGH_MAX_LATE_MS = 30 * 60_000;
const SENDER = { from_name: "AmiLynne Carroll", from_email: "hello@lccommandsuite.com", reply_to: "support@lccommandsuite.com" };

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

export async function sendDueWalkthroughs(db: Db, housePlan: string): Promise<{ on: boolean; sent: number; skipped: number; failed: number }> {
  const on = (await setting(db, "client_walkthrough_on")).toLowerCase() === "true";
  if (!on) return { on, sent: 0, skipped: 0, failed: 0 };
  const broadcastId = await setting(db, "client_walkthrough_broadcast_id");
  const { data: tpl } = broadcastId ? await db.from("crm_broadcasts").select("subject, preview, body, button_label, button_url, brand").eq("id", broadcastId).maybeSingle() : { data: null };
  if (!tpl?.body || !tpl?.subject) return { on, sent: 0, skipped: 0, failed: 0 };

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
    // Claim the row first so two overlapping runs can't both send.
    const { data: claim } = await db.from("client_walkthrough_queue").update({ sent_at: new Date().toISOString(), result: "sending" }).eq("id", row.id).is("sent_at", null).select("id");
    if (!claim?.length) continue;
    const first = (row.name || "").trim().split(/\s+/)[0] || null;
    const c = await upsertContact({ masterPlanId: housePlan, email: row.email, firstName: first, source: "account", tags: [] }, db).catch(() => null);
    if (!c || c.unsubscribed) {
      await db.from("client_walkthrough_queue").update({ skipped_reason: c ? "unsubscribed" : "no contact", sent_at: null, result: null }).eq("id", row.id);
      skipped++;
      continue;
    }
    const mail = renderStep({
      brand: (tpl.brand as string) || "LifeCharter Command Suite",
      subject: tpl.subject as string,
      preview: tpl.preview as string | null,
      body: tpl.body as string,
      buttonLabel: tpl.button_label as string | null,
      buttonUrl: tpl.button_url as string | null,
      contact: { id: c.id, first_name: first },
    });
    const r = await sendRendered(SENDER, row.email, c.id, mail);
    if (r.ok) {
      sent++;
      await db.from("client_walkthrough_queue").update({ result: "sent" }).eq("id", row.id);
      await logEvent(housePlan, c.id, "email", `New Client Setup Walkthrough sent: “${mail.subject}”`, { kind: "client-walkthrough" }, db).catch(() => {});
    } else {
      failed++;
      await db.from("client_walkthrough_queue").update({ sent_at: null, result: `failed: ${r.error ?? "unknown"}`.slice(0, 200) }).eq("id", row.id); // the next run retries (until it is 30 minutes late)
    }
  }
  return { on, sent, skipped, failed };
}
