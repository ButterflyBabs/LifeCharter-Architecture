import { createServerClient } from "@/lib/supabase/server";
import { renderStep } from "@/lib/sequences/render";
import { sendRendered } from "@/lib/sequences/engine";
import { logEvent } from "@/lib/crm";
import type { ZoomRegistrant } from "@/lib/zoom";

type Db = ReturnType<typeof createServerClient>;

// Founder's Half Hour recap emails: after each Tuesday call, people who came get a short thank-you with their
// next step, and people who registered but did not come get a "we missed you". Each is sent once per session.
// OFF until app_settings founders_recap_on = "true" (Babs approves the wording first).
const SENDER = { from_name: "AmiLynne Carroll", from_email: "hello@lccommandsuite.com", reply_to: "support@lccommandsuite.com" };
const REGISTER = "https://us02web.zoom.us/meeting/register/Yv6WtkGmRaGGDLhoPrMMfw";

export const RECAP = {
  attended: {
    subject: "Thank you for coming to Founder's Half Hour",
    preview: "Your next step, and when we meet again.",
    body: `{{greeting}}

Thank you for joining Founder's Half Hour today. I'm glad you were there.

To keep the momentum going:

- Write down the one next step you chose, and put a day and time on it.
- Come back next Tuesday at 1:00 pm Mountain, and tell us how it went. Same 30 minutes, same free call.
- If you want a full 90 minutes on your own business, the free Command Shift MasterClass is the next step.

Reply to this email if there's anything I can help you think through.`,
    button: "Save my seat for next Tuesday",
  },
  missed: {
    subject: "We missed you at Founder's Half Hour",
    preview: "No worries. Here is how to join next Tuesday.",
    body: `{{greeting}}

You were registered for Founder's Half Hour today, and we didn't get to see you. No worries, life happens.

It's every Tuesday at 1:00 pm Mountain, 30 minutes, free. Bring one real question about your business and leave with a next step.

Your seat for next week takes one click.`,
    button: "Save my seat for next Tuesday",
  },
} as const;

export async function recapOn(db: Db): Promise<boolean> {
  const { data } = await db.from("app_settings").select("value").eq("key", "founders_recap_on").maybeSingle();
  return String(data?.value ?? "").toLowerCase() === "true";
}

/** Sends the recaps for ONE finished session. `came` = emails that attended; `registrants` = who registered. */
export async function sendFoundersRecaps(
  db: Db,
  housePlan: string,
  o: { uuid: string; start: string; came: Set<string>; registrants: ZoomRegistrant[] }
): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;
  const startMs = new Date(o.start).getTime();
  const targets: { email: string; kind: "attended" | "missed"; first: string }[] = [];
  for (const e of Array.from(o.came)) targets.push({ email: e, kind: "attended", first: "" });
  for (const r of o.registrants) {
    const e = r.email.trim().toLowerCase();
    const regAt = r.createTime ? new Date(r.createTime).getTime() : 0;
    if (!o.came.has(e) && regAt && regAt < startMs) targets.push({ email: e, kind: "missed", first: r.firstName });
  }
  for (const t of targets) {
    const { data: c } = await db.from("seq_contacts").select("id, first_name, unsubscribed_at").eq("master_plan_id", housePlan).eq("email", t.email).maybeSingle();
    if (!c || c.unsubscribed_at) {
      skipped++;
      continue;
    }
    // Claim first: the unique key is the lock.
    const { data: claim } = await db.from("call_recap_sends").upsert({ meeting_uuid: o.uuid, email: t.email, kind: t.kind }, { onConflict: "meeting_uuid,email,kind", ignoreDuplicates: true }).select("email");
    if (!claim?.length) continue;
    const tpl = RECAP[t.kind];
    const mail = renderStep({ brand: "Founder's Half Hour", subject: tpl.subject, preview: tpl.preview, body: tpl.body, buttonLabel: tpl.button, buttonUrl: REGISTER, contact: { id: c.id as string, first_name: (c.first_name as string | null) || t.first || null } });
    const r = await sendRendered(SENDER, t.email, c.id as string, mail);
    if (r.ok) {
      sent++;
      await logEvent(housePlan, c.id as string, "email", `Founder's Half Hour recap (${t.kind === "attended" ? "thank you" : "we missed you"}): “${mail.subject}”`, { kind: t.kind, session: o.start }, db).catch(() => {});
    } else {
      await db.from("call_recap_sends").delete().eq("meeting_uuid", o.uuid).eq("email", t.email).eq("kind", t.kind); // let a later run retry
    }
  }
  return { sent, skipped };
}
