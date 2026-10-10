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

The link works once and lasts 24 hours. If it has expired by the time you open this, that is fine: go to lccommandsuite.com/forgot-password, enter this email address, and a fresh link comes straight to you. After that, you always sign in at lccommandsuite.com/login with this email and your new password.`;

const CLOSE = `Questions? Just reply to this email.

Head up - Wings out,

AmiLynne "Babs" Carroll
Executive, Alignment Architect, and Chief Travel Partner
LifeCharter by AmiLynne Carroll`;

// A paying client. There is no "wait" request any more (Babs, 2026-10-10): the New Client Setup Walkthrough email
// follows a few minutes later and walks them through setup in order. callWhen is kept for older callers and is not used.
export function defaultClientBody(): string {
  return `${OPEN}

**Step 2: Watch for your walkthrough.** In a few minutes you'll get a second email from me with your first hour in Command Suite, step by step: how to sign in and bookmark it, connect your AI, name your assistant, and take your assessments in order.

${CLOSE}`;
}

// A LifeCharter team member with their own account to test and explore: no assessments or setup required.
export function defaultTeamBody(): string {
  return `${OPEN}

**Step 2: Explore.** This is your own account to look around in, test and play with. You don't need to complete Getting Started or the assessments to use it, so that first-page reminder is switched off for you.

**Your MasterClass Affiliate link.** This is your personal affiliate link for the free Command Shift MasterClass: {{masterclass_link}}
Share it with the people in your world. Anyone who registers through it is tracked back to you, earning 10% should they sign up.

${CLOSE}`;
}

// A Pre-Founder. No "wait for the 1:1" request any more (Babs, 2026-10-10); oneToOne is kept for older callers and is not used.
export function defaultBody(): string {
  return `${OPEN}

**Step 2: Watch for your walkthrough.** In a few minutes you'll get a second email from me with your first hour in Command Suite, step by step: how to sign in and bookmark it, connect your AI, name your assistant, and take your assessments in order.

**Your MasterClass Affiliate link.** This is your personal affiliate link for the free Command Shift MasterClass: {{masterclass_link}}
Share it with the people in your world. Anyone who registers through it is tracked back to you, earning 10% should they sign up.

${CLOSE}`;
}

export function bodyFor(kind: EmailKind): string {
  return kind === "client" ? defaultClientBody() : kind === "team" ? defaultTeamBody() : defaultBody();
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
