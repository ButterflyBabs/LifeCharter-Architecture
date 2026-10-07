// The "your account is ready" email: sent to every new Command Suite user whose account Babs creates,
// with a one-time link to choose their password. A copy always goes to AmiLynne (hidden copy).
// Written with Babs 2026-10-06; she approves the wording before anything is sent.

export const ACCOUNT_EMAIL_COPY_TO = "amilynne@amilynnecarroll.com";
const FROM = "AmiLynne Carroll <hello@lccommandsuite.com>";
const REPLY_TO = "support@lccommandsuite.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type AccountReadyInput = {
  firstName: string;
  loginUrl: string; // the one-time choose-your-password link
  oneToOne?: string | null; // "Thursday, October 8 at 9:00 AM Mountain"; blank when not booked yet
  holdAssessments?: boolean; // ask them not to start the assessments before the 1:1
  masterclassLink?: string | null; // their own affiliate link for the MasterClass
};

export function renderAccountReadyEmail(i: AccountReadyInput): { subject: string; html: string; text: string } {
  const hi = i.firstName ? `Hi ${i.firstName},` : "Hi there,";
  const when = i.oneToOne ? `at our 1:1, ${i.oneToOne}` : "at our 1:1";
  const loginPage = `${APP_URL}/login`;
  const p = 'style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2E3A46"';
  const parts: { html: string; text: string }[] = [];
  parts.push({ html: `<p ${p}>${esc(hi)}</p>`, text: hi });
  parts.push({ html: `<p ${p}>Your LifeCharter Command Suite account is ready, and I'm so glad you're here.</p>`, text: "Your LifeCharter Command Suite account is ready, and I'm so glad you're here." });
  parts.push({
    html: `<p ${p}><strong>Step 1: Choose your password.</strong> Press the button below. It signs you in and lets you choose your own password.</p>
<p style="margin:22px 0"><a href="${esc(i.loginUrl)}" style="display:inline-block;background:#0F1A38;color:#E9D7A9;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none">Choose my password and sign in</a></p>
<p ${p}>The link works once and expires after an hour. If it has expired, go to <a href="${loginPage}" style="color:#2E7C83">${loginPage.replace("https://", "")}</a>, click "Forgot or set your password?", enter this email address, and a fresh link comes straight to you. After that, you always sign in at ${loginPage.replace("https://", "")} with this email and your new password.</p>`,
    text: `Step 1: Choose your password. Press this link. It signs you in and lets you choose your own password:\n${i.loginUrl}\n\nThe link works once and expires after an hour. If it has expired, go to ${loginPage}, click "Forgot or set your password?", enter this email address, and a fresh link comes straight to you. After that, you always sign in at ${loginPage} with this email and your new password.`,
  });
  if (i.holdAssessments) {
    parts.push({
      html: `<p ${p}><strong>Step 2: Then pause and wait for me.</strong> The first page you'll see is Set up Suite, and it will ask you to begin your assessments (Brain, Soul and Profit). Please don't start them yet. I want us to go through them together ${esc(when)}, so they're set up right from the start. If you'd like to look around first, choose "skip for now" on that page.</p>`,
      text: `Step 2: Then pause and wait for me. The first page you'll see is Set up Suite, and it will ask you to begin your assessments (Brain, Soul and Profit). Please don't start them yet. I want us to go through them together ${when}, so they're set up right from the start. If you'd like to look around first, choose "skip for now" on that page.`,
    });
  } else {
    parts.push({
      html: `<p ${p}><strong>Step 2: Set up Suite.</strong> The first page you'll see is Set up Suite, which guides you through everything in order.</p>`,
      text: "Step 2: Set up Suite. The first page you'll see is Set up Suite, which guides you through everything in order.",
    });
  }
  if (i.masterclassLink) {
    parts.push({
      html: `<p ${p}><strong>Your MasterClass link.</strong> This is your personal link for the free Command Shift MasterClass: <a href="${esc(i.masterclassLink)}" style="color:#2E7C83">${esc(i.masterclassLink)}</a>. Share it with the people in your world. Anyone who registers through it is tracked back to you, and I'll walk you through how it works at our 1:1.</p>`,
      text: `Your MasterClass link. This is your personal link for the free Command Shift MasterClass: ${i.masterclassLink}\nShare it with the people in your world. Anyone who registers through it is tracked back to you, and I'll walk you through how it works at our 1:1.`,
    });
  }
  parts.push({ html: `<p ${p}>Questions? Just reply to this email.</p>`, text: "Questions? Just reply to this email." });
  const sig = ["Head up - Wings out,", "", 'AmiLynne "Babs" Carroll', "Executive, Alignment Architect, and Chief Travel Partner", "LifeCharter by AmiLynne Carroll"];
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#0F1A38">${parts.map((x) => x.html).join("\n")}<p ${p}>${sig.map((l) => (l ? esc(l) : "<br>")).join("<br>")}</p></div>`;
  const text = `${parts.map((x) => x.text).join("\n\n")}\n\n${sig.join("\n")}`;
  return { subject: "Your LifeCharter Command Suite account is ready", html, text };
}

// Sends it, with the hidden copy to AmiLynne. Returns whether Resend accepted it.
export async function sendAccountReadyEmail(to: string, i: AccountReadyInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const { subject, html, text } = renderAccountReadyEmail(i);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, bcc: [ACCOUNT_EMAIL_COPY_TO], reply_to: REPLY_TO, subject, html, text }),
  }).catch(() => null);
  if (res && !res.ok) console.error("account-ready email failed:", res.status, await res.text().catch(() => ""));
  return Boolean(res?.ok);
}
