// Team-member invitation email for Command Suite, sent through Resend (the same sender setup the
// Collective and LifeCharter Program use). From support@lccommandsuite.com. Replies go to the person who
// added the team member (the account owner's reply-to address) when we have one, otherwise to
// support@lccommandsuite.com.
// Never throws: returns false if email isn't configured or the send fails, so the invite link
// still works and can be copied by hand.

const ROLE_LINE: Record<string, string> = {
  admin: "As an Admin, you can run the account day to day and manage the team.",
  editor: "As an Editor, you can work on the business: tasks, plans, content, finance and sales activity.",
  viewer: "As a Viewer, you can see the account's work without changing it.",
  sales: "You'll have access to the sales page and its contacts.",
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendTeamInvite(opts: {
  to: string;
  name: string | null;
  inviterName: string;
  workspaceName: string;
  role: string;
  /** Set-password link for a new login, or the sign-in page for someone who already has one. */
  link: string;
  hasLogin: boolean;
  base: string;
  /** Where replies should go: the person who added them. Falls back to support. */
  replyTo?: string | null;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("team invite email: RESEND_API_KEY not set");
    return false;
  }
  const first = (opts.name || "").split(" ")[0];
  const roleLine = ROLE_LINE[opts.role] || "";
  const button = opts.hasLogin ? "Sign in to Command Suite" : "Set your password";
  const how = opts.hasLogin
    ? "You already have a LifeCharter login with this email, so just sign in with your usual password."
    : "Choose a password to create your login. This link works once and expires in 7 days.";

  const replyTo = opts.replyTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(opts.replyTo) ? opts.replyTo : "support@lccommandsuite.com";
  const direct = replyTo !== "support@lccommandsuite.com";
  const questions = direct
    ? `Questions about your role or the team? Reply to this email to reach ${opts.inviterName}. For help with Command Suite itself, write to support@lccommandsuite.com.`
    : "Questions? Reply to this email or write to support@lccommandsuite.com.";
  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8923F;font-weight:bold">LifeCharter Command Suite</td></tr>
    <tr><td style="font-size:26px;color:#1a2b4a;padding:8px 0 12px">You're invited to join ${esc(opts.workspaceName)}</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">
      ${first ? `Hi ${esc(first)},<br><br>` : ""}${esc(opts.inviterName)} has added you to their team in LifeCharter Command Suite. ${esc(roleLine)}<br><br>${esc(how)}
    </td></tr>
    <tr><td style="padding:24px 0 8px"><a href="${opts.link}" style="display:inline-block;background:#1a2b4a;color:#F8F5F0;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">${button}</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#7F8894;padding-top:14px">If you weren't expecting this, you can ignore it. ${esc(questions)}</td></tr>
  </table></td></tr></table></body></html>`;
  const text = `${first ? `Hi ${first},\n\n` : ""}${opts.inviterName} has added you to their team (${opts.workspaceName}) in LifeCharter Command Suite. ${roleLine}\n\n${how}\n\n${button}: ${opts.link}\n\n${questions}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "LifeCharter Command Suite <support@lccommandsuite.com>",
        to: opts.to,
        reply_to: replyTo,
        subject: `You're invited to join ${opts.workspaceName} on LifeCharter Command Suite`,
        html,
        text,
      }),
    });
    if (!res.ok) console.error("team invite email:", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("team invite email:", (e as Error).message);
    return false;
  }
}
