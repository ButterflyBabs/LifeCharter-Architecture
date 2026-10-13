// A renewal payment failed. Three things:
//   1. the account is marked past_due (the webhook does that; the bell alert is derived from it in alerts.ts),
//   2. the client gets an email telling them how to fix it, and
//   3. Babs gets a heads-up.
// 2 and 3 are behind the app_settings flag payment_failed_emails_on (off until the wording is approved), and each
// failed invoice is announced once however many times Stripe retries it.

import { createServerClient } from "@/lib/supabase/server";

type Db = ReturnType<typeof createServerClient>;

const FROM = "AmiLynne Carroll <hello@lccommandsuite.com>";
const REPLY_TO = "support@lccommandsuite.com";
const BABS = "amilynne@amilynnecarroll.com";
const APP = process.env.NEXT_PUBLIC_APP_URL || "https://lccommandsuite.com";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const shell = (inner: string) =>
  `<!doctype html><html><body style="margin:0;background:#FAF8F3"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px"><table width="560" style="max-width:560px;background:#fff;border-radius:12px;padding:28px;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#0F1A38"><tr><td>${inner}</td></tr></table></td></tr></table></body></html>`;

async function send(to: string, subject: string, html: string, bcc?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, bcc, reply_to: REPLY_TO, subject, html }),
  });
  if (!res.ok) console.error("payment-failed email:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export async function paymentFailedEmailsOn(db: Db): Promise<boolean> {
  const { data } = await db.from("app_settings").select("value").eq("key", "payment_failed_emails_on").maybeSingle();
  return String(data?.value ?? "").toLowerCase() === "true";
}

// DRAFT WORDING: not sent until Babs approves it and payment_failed_emails_on is set to true.
export function clientPaymentFailedEmail(firstName: string) {
  return {
    subject: "Your Command Suite payment didn't go through",
    html: shell(`<p>Hi ${esc(firstName || "there")},</p>
<p>Your most recent LifeCharter Command Suite payment didn't go through. That is usually just a card that has expired or needs updating.</p>
<p>You can fix it in about a minute: open <a href="${APP}/settings">Settings</a>, choose Billing, then Manage billing and update your card. Doing it now keeps your plan running without interruption.</p>
<p>If anything looks wrong or you would like a hand, just reply to this email.</p>
<p>Head up - Wings out,</p>
<p>AmiLynne "Babs" Carroll<br>Executive, Alignment Architect, and Chief Travel Partner<br>LifeCharter by AmiLynne Carroll</p>`),
  };
}

export async function notifyPaymentFailed(db: Db, i: { userId: string; invoiceId: string; amountCents: number }) {
  try {
    if (!i.invoiceId) return;
    // Claim this invoice: only the first failure event for it goes any further.
    const { data: claimed } = await db.from("payment_failed_notices").upsert({ invoice_id: i.invoiceId, user_id: i.userId }, { onConflict: "invoice_id", ignoreDuplicates: true }).select("invoice_id");
    if (!(claimed ?? []).length) return;
    if (!(await paymentFailedEmailsOn(db))) return;

    const { data: prof } = await db.from("profiles").select("email, full_name").eq("id", i.userId).maybeSingle();
    if (!prof?.email) return;
    const first = (prof.full_name || "").trim().split(/\s+/)[0] || "";
    const c = clientPaymentFailedEmail(first);
    await send(prof.email, c.subject, c.html, BABS);

    const amount = i.amountCents > 0 ? ` for $${(i.amountCents / 100).toFixed(2)}` : "";
    await send(
      BABS,
      `Payment failed: ${prof.full_name || prof.email}`,
      shell(`<p><b>${esc(prof.full_name || prof.email)}</b> (${esc(prof.email)})'s Command Suite payment${amount} did not go through. Stripe will retry it; they have been emailed how to update their card.</p>`),
    );
  } catch (e) {
    console.error("notifyPaymentFailed:", e);
  }
}
