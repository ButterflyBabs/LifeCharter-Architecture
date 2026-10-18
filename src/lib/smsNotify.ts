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
