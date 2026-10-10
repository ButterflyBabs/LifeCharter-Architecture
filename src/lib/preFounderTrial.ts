// Pre-Founders get six free months of the VIP plan, then $497 a month. Nothing is billed until then, so the
// Suite keeps the dates: a tag with the trial end when the account is made, and a daily check that tells
// Babs (and, once she has switched it on and set the payment link, the client) at month 5.

export const PRE_FOUNDER_TAG = "pre-founder";

export function addMonths(d: Date, n: number) {
  const x = new Date(d.getTime());
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}

const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
export const trialEndTag = (sentAt: Date) => `pre-founder-trial-ends-${ymd(addMonths(sentAt, 6))}`;
export const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const shell = (inner: string) =>
  `<!doctype html><html><body style="margin:0;background:#FAF8F3"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px"><table width="560" style="max-width:560px;background:#fff;border-radius:12px;padding:28px;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#0F1A38"><tr><td>${inner}</td></tr></table></td></tr></table></body></html>`;

export function clientNoticeEmail(firstName: string, endDate: string, paymentLink: string) {
  return {
    subject: "Your 6 free months are almost up",
    html: shell(`<p>Hi ${esc(firstName || "there")},</p>
<p>When you joined as a Pre-Founder, you received six free months of your LifeCharter Command Suite VIP account. Those months end on <b>${esc(endDate)}</b>.</p>
<p>To keep your account running without a break, add your card here. Your Pre-Founder rate is $497 a month.</p>
<p><a href="${esc(paymentLink)}" style="display:inline-block;background:#0F1A38;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-family:Arial,sans-serif;font-weight:bold;font-size:14px">Add my card</a></p>
<p>Questions? Just reply to this email.</p>
<p>Head up - Wings out,</p>
<p>AmiLynne "Babs" Carroll<br>Executive, Alignment Architect, and Chief Travel Partner<br>LifeCharter by AmiLynne Carroll</p>`),
  };
}
