import { createServerClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServerClient>;
const SITE = () => (process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com").replace(/\/$/, "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Someone texted the account's number: email the owner (two-way replies from the Suite come next). */
export async function notifyOwnerOfText(db: Db, planId: string, who: string, body: string, contactId: string | null): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const { data: plan } = await db.from("client_master_plans").select("client_email").eq("id", planId).maybeSingle();
  const to = plan?.client_email as string | undefined;
  if (!to) return;
  const link = contactId ? `${SITE()}/contacts?contact=${contactId}` : `${SITE()}/settings?tab=texts`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46"><p><strong>${esc(who)}</strong> sent a text to your Command Suite number:</p><blockquote style="margin:0 0 16px;padding:10px 14px;background:#F4F1EA;border-radius:10px">${esc(body.slice(0, 1500)).replace(/\n/g, "<br>")}</blockquote><p><a href="${link}" style="color:#2E7C83;font-weight:bold">Open in the Command Suite</a></p></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "LifeCharter Command Suite <notifications@lccommandsuite.com>", to, subject: `New text from ${who}`, html }),
  }).catch(() => null);
}

/** The carriers decided: tell the owner, because nothing else does and approval takes 5 to 15 business days. */
export async function notifyOwnerOfTextingDecision(db: Db, planId: string, outcome: "approved" | "rejected", note: string | null): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const { data: plan } = await db.from("client_master_plans").select("client_email").eq("id", planId).maybeSingle();
  const to = plan?.client_email as string | undefined;
  if (!to) return;
  const link = `${SITE()}/settings?tab=texts`;
  const ok = outcome === "approved";
  const lines = ok
    ? "<p>Your texting number is approved. Booking pages can now offer text reminders, and you can reply to texts from a contact's record.</p><p>Next step: open Settings &gt; Text messages and press Send me a test, then try a booking with the text-reminder box ticked.</p>"
    : `<p>The carriers did not approve your texting number yet.${note ? ` Their note: <em>${esc(note)}</em>` : ""}</p><p>Open Settings &gt; Text messages to see what to change, then send it again. Nothing was charged for the review.</p>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${lines}<p><a href="${link}" style="display:inline-block;background:#2F2A6B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open Text messages</a></p></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "LifeCharter Command Suite <notifications@lccommandsuite.com>", to, subject: ok ? "Your texting number is approved" : "Your texting number needs a change", html }),
  }).catch(() => null);
}

async function ownerOf(db: Db, planId: string): Promise<{ to: string | null; name: string }> {
  const { data: plan } = await db.from("client_master_plans").select("client_email, client_name").eq("id", planId).maybeSingle();
  return { to: (plan?.client_email as string | null) ?? null, name: (plan?.client_name as string | null) ?? "" };
}

async function mailAndRemind(db: Db, planId: string, to: string | null, subject: string, bodyHtml: string, title: string, notes: string): Promise<void> {
  await db.from("reminders").insert({ master_plan_id: planId, title, notes, remind_at: new Date().toISOString(), status: "open" }).then(() => null, () => null);
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46">${bodyHtml}<p><a href="${SITE()}/settings?tab=texts" style="display:inline-block;background:#2F2A6B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open Text messages</a></p><p>Head up - Wings out<br>Babs 🦋</p></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "LifeCharter Command Suite <notifications@lccommandsuite.com>", to, subject, html }),
  }).catch(() => null);
}

/** The account has used 80% (a heads-up) or all (texting pauses until the 1st) of its monthly texts. Told once, at the crossing. */
export async function notifyOwnerOfTextUsage(db: Db, planId: string, level: "warn" | "full", used: number, cap: number): Promise<void> {
  const { to } = await ownerOf(db, planId);
  const left = Math.max(0, cap - used);
  const title = level === "full" ? `All ${cap} of this month's texts are used` : `${used} of ${cap} texts used this month`;
  const notes = level === "full" ? "Texts to your contacts are paused until the 1st. Replies you receive still arrive." : `${left} left this month. Booking and event reminders count too.`;
  await mailAndRemind(db, planId, to, level === "full" ? "You have used all of this month's texts" : "You have used 80% of this month's texts", `<p>${esc(title)}.</p><p>${esc(notes)}</p>`, title, notes);
}

/** The Suite's own Twilio balance is low: texts stop for every account when it reaches zero. Goes to the house account's owner. */
export async function notifyOwnerOfLowTwilioBalance(db: Db, planId: string, balance: number): Promise<void> {
  const { to } = await ownerOf(db, planId);
  const title = `Twilio balance is $${balance.toFixed(2)}`;
  const notes = "Texts stop for every account when it reaches zero. Add funds, or turn on auto-recharge, in Twilio under Billing.";
  await mailAndRemind(db, planId, to, "Your Twilio balance is low", `<p>${esc(title)}.</p><p>${esc(notes)}</p><p><a href="https://console.twilio.com">Open Twilio</a></p>`, title, notes);
}

