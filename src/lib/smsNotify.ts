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
