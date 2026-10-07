// The "your account is ready" email sent to each new Command Suite client Babs creates an account for.
// She writes, edits and approves it per person on the New Client Accounts page (table new_client_emails);
// nothing is created or sent until it is approved. A copy always goes to AmiLynne (hidden copy).
// Merge fields in the body: {{greeting}} ("Hi Name,"), {{password_link}} (the one-time choose-your-password
// link, shown as a button when it sits on a line of its own) and {{masterclass_link}} (their own link).

export const ACCOUNT_EMAIL_COPY_TO = "amilynne@amilynnecarroll.com";
const FROM = "AmiLynne Carroll <hello@lccommandsuite.com>";
const REPLY_TO = "support@lccommandsuite.com";

export const DEFAULT_SUBJECT = "Your LifeCharter Command Suite account is ready";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type EmailKind = "pre-founder" | "client" | "team";

const OPEN = `{{greeting}}

Your LifeCharter Command Suite account is ready, and I'm so glad you're here.

**Step 1: Choose your password.** Press the button below. It signs you in and lets you choose your own password.

{{password_link}}

The link works once and expires after an hour. If it has expired, go to lccommandsuite.com/login, click "Forgot or set your password?", enter this email address, and a fresh link comes straight to you. After that, you always sign in at lccommandsuite.com/login with this email and your new password.`;

const CLOSE = `Questions? Just reply to this email.

Head up - Wings out,

AmiLynne "Babs" Carroll
Executive, Alignment Architect, and Chief Travel Partner
LifeCharter by AmiLynne Carroll`;

// A paying client: they wait for their New Client Implementation Call (it may be a group call) before the assessments.
// callWhen reads like "Thursday, October 15 at 5:00 PM Mountain" (blank when not set yet).
export function defaultClientBody(callWhen?: string | null): string {
  const when = callWhen ? `on your New Client Implementation Call, ${callWhen}` : "on your New Client Implementation Call";
  return `${OPEN}

**Step 2: Then pause and wait for your New Client Implementation Call.** The first page you'll see is Set up Suite, and it will ask you to begin your assessments (Brain, Soul and Profit). Please don't start them yet. We'll go through them together ${when}, so they're set up right from the start. If you'd like to look around first, choose "skip for now" on that page.

${CLOSE}`;
}

// A LifeCharter team member with their own account to test and explore: no assessments or setup required.
export function defaultTeamBody(): string {
  return `${OPEN}

**Step 2: Explore.** This is your own account to look around in, test and play with. You don't need to complete Getting Started or the assessments to use it, so that first-page reminder is switched off for you.

**Your MasterClass link.** This is your personal link for the free Command Shift MasterClass: {{masterclass_link}}
Share it with the people in your world. Anyone who registers through it is tracked back to you.

${CLOSE}`;
}

// A Pre-Founder: oneToOne reads like "Thursday, October 8 at 9:00 AM Mountain" (blank when not booked yet).
export function defaultBody(oneToOne?: string | null): string {
  const when = oneToOne ? `at our 1:1, ${oneToOne}` : "at our 1:1";
  return `${OPEN}

**Step 2: Then pause and wait for me.** The first page you'll see is Set up Suite, and it will ask you to begin your assessments (Brain, Soul and Profit). Please don't start them yet. I want us to go through them together ${when}, so they're set up right from the start. If you'd like to look around first, choose "skip for now" on that page.

**Your MasterClass link.** This is your personal link for the free Command Shift MasterClass: {{masterclass_link}}
Share it with the people in your world. Anyone who registers through it is tracked back to you, and I'll walk you through how it works at our 1:1.

${CLOSE}`;
}

export function bodyFor(kind: EmailKind, when?: string | null): string {
  return kind === "client" ? defaultClientBody(when) : kind === "team" ? defaultTeamBody() : defaultBody(when);
}

export type Merge = { firstName: string; loginUrl: string; masterclassLink: string | null };

function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(https?:\/\/[^\s<]+[^\s<.,)])/g, '<a href="$1" style="color:#2E7C83">$1</a>');
}

// Turns the approved text into the email that goes out (HTML and plain text).
export function renderAccountEmail(subject: string, body: string, m: Merge): { subject: string; html: string; text: string } {
  const greeting = m.firstName ? `Hi ${m.firstName},` : "Hi there,";
  const mc = m.masterclassLink || "";
  const fill = (s: string) => s.replace(/\{\{greeting\}\}/g, greeting).replace(/\{\{masterclass_link\}\}/g, mc);
  const p = 'style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2E3A46"';
  const blocks = body.trim().split(/\n{2,}/);
  const html = blocks
    .map((b) => {
      if (b.trim() === "{{password_link}}")
        return `<p style="margin:22px 0"><a href="${esc(m.loginUrl)}" style="display:inline-block;background:#0F1A38;color:#E9D7A9;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none">Choose my password and sign in</a></p>`;
      return `<p ${p}>${fill(b).split("\n").map((l) => inline(l).replace(/\{\{password_link\}\}/g, `<a href="${esc(m.loginUrl)}" style="color:#2E7C83">${esc(m.loginUrl)}</a>`)).join("<br>")}</p>`;
    })
    .join("\n");
  const text = fill(body).replace(/\{\{password_link\}\}/g, m.loginUrl).replace(/\*\*(.+?)\*\*/g, "$1");
  return { subject, html: `<div style="font-family:Arial,sans-serif;max-width:560px;color:#0F1A38">${html}</div>`, text };
}

// Sends it, with the hidden copy to AmiLynne. Returns whether Resend accepted it.
export async function sendRendered(to: string, r: { subject: string; html: string; text: string }, opts: { bcc?: boolean; extraBcc?: string[] } = {}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, ...(opts.bcc === false ? {} : { bcc: Array.from(new Set([ACCOUNT_EMAIL_COPY_TO, ...(opts.extraBcc ?? [])].map((x) => x.toLowerCase()))).filter((x) => x !== to.toLowerCase()) }), reply_to: REPLY_TO, subject: r.subject, html: r.html, text: r.text }),
  }).catch(() => null);
  if (res && !res.ok) console.error("account-ready email failed:", res.status, await res.text().catch(() => ""));
  return Boolean(res?.ok);
}
