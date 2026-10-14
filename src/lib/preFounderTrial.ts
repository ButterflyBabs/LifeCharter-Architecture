// Pre-Founders get free months of the VIP plan, then $497 a month. Nothing is billed until then, so the
// Suite keeps the dates: a tag with the trial end when the account is made, and a daily check that tells
// Babs (and, once she has switched it on and set the payment link, the client) a month before.
// Decided 2026-10-11: everyone's first $497 charge is the same day, April 1, 2027.

export const PRE_FOUNDER_TAG = "pre-founder";

export function addMonths(d: Date, n: number) {
  const x = new Date(d.getTime());
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}

const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Denver" });

// Midnight Mountain time at the start of April 1, 2027 (MDT is UTC-6), and the heads-up one month earlier
// (March 1, MST is UTC-7).
export const FIRST_CHARGE_AT = new Date("2027-04-01T06:00:00Z");
export const FIRST_NOTICE_AT = new Date("2027-03-01T07:00:00Z");

// The day a Pre-Founder's free months end. Everyone shares the first-charge date; the six-months-from-signup rule
// only applies if somebody is made a Pre-Founder after that date has passed.
export function trialEndFor(sentAt: Date, now: Date = new Date()) {
  return now < FIRST_CHARGE_AT ? FIRST_CHARGE_AT : addMonths(sentAt, 6);
}
export function noticeAtFor(sentAt: Date, now: Date = new Date()) {
  return now < FIRST_CHARGE_AT ? FIRST_NOTICE_AT : addMonths(sentAt, 5);
}
export const trialEndTag = (sentAt: Date) => `pre-founder-trial-ends-${ymd(trialEndFor(sentAt))}`;
export const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Denver" });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const shell = (inner: string) =>
  `<!doctype html><html><body style="margin:0;background:#FAF8F3"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px"><table width="560" style="max-width:560px;background:#fff;border-radius:12px;padding:28px;font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#0F1A38"><tr><td>${inner}</td></tr></table></td></tr></table></body></html>`;

export function clientNoticeEmail(firstName: string, endDate: string, paymentLink: string) {
  return {
    subject: "Your 6 free months are almost up",
    html: shell(`<p>Hi ${esc(firstName || "there")},</p>
<p>When you joined as a Pre-Founder, you received free months of your LifeCharter Command Suite VIP account. Those months end on <b>${esc(endDate)}</b>.</p>
<p>To keep your account running without a break, add your card here. Your Pre-Founder rate is $497 a month.</p>
<p><a href="${esc(paymentLink)}" style="display:inline-block;background:#0F1A38;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-family:Arial,sans-serif;font-weight:bold;font-size:14px">Add my card</a></p>
<p>Questions? Just reply to this email.</p>
<p>Head up - Wings out,</p>
<p>AmiLynne "Babs" Carroll<br>Executive, Alignment Architect, and Chief Travel Partner<br>LifeCharter by AmiLynne Carroll</p>`),
  };
}
