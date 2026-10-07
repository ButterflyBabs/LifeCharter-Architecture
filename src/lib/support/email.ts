// Support desk emails (Resend). New requests and client replies go to the
// support inbox; support replies go to the client. Replies always route back to
// support@lccommandsuite.com. Quietly skips when RESEND_API_KEY isn't set.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.SUPPORT_EMAIL_FROM || "LifeCharter Support <support@lccommandsuite.com>";
export const SUPPORT_INBOX = "support@lccommandsuite.com";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(heading: string, bodyHtml: string, button?: { href: string; label: string }) {
  return `<!doctype html><html><body style="margin:0;background:#FBF7F0;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;padding:26px;border:1px solid #E4DACA">
    <tr><td style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700">LifeCharter Support</td></tr>
    <tr><td style="font-size:21px;color:#23255C;padding:8px 0 10px;font-family:Georgia,serif">${esc(heading)}</td></tr>
    <tr><td style="font-size:15px;color:#3A3B5C;line-height:1.6">${bodyHtml}</td></tr>
    ${button ? `<tr><td style="padding-top:20px"><a href="${button.href}" style="display:inline-block;background:#23255C;color:#fff;font-weight:700;padding:11px 20px;border-radius:10px;text-decoration:none">${esc(button.label)}</a></td></tr>` : ""}
  </table></td></tr></table></body></html>`;
}

const para = (s: string) => esc(s).replace(/\n/g, "<br>");

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, reply_to: SUPPORT_INBOX, subject, html }),
  });
  if (!res.ok) console.error("support email:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export function notifyNewRequest(r: { id: string; name: string; email: string; subject: string; message: string; category: string; priority: string; source: string }) {
  return send(
    SUPPORT_INBOX,
    `[Support] ${r.subject}`,
    wrap(
      `New ${r.priority === "high" || r.priority === "urgent" ? "priority " : ""}request from ${r.name}`,
      `<p><strong>${esc(r.subject)}</strong> · ${esc(r.category)}${r.source === "travel_partner" ? " · from Travel Partner" : ""}</p><p>${para(r.message)}</p><p style="color:#8A8BA3;font-size:13px">${esc(r.name)} · ${esc(r.email)}</p>`,
      { href: `${APP_URL}/support-desk?id=${r.id}`, label: "Open in the Support Desk" }
    )
  );
}

// A new suggestion or general feedback on the shared boards: tell support, so nothing posted goes unseen.
export function notifyNewIdea(i: { kind: "suggestion" | "feedback"; name: string; email: string; title: string; description: string }) {
  const label = i.kind === "suggestion" ? "Suggestion" : "General feedback";
  return send(
    SUPPORT_INBOX,
    `[${label}] ${i.title}`,
    wrap(`${label} from ${i.name}`, `<p><strong>${esc(i.title)}</strong></p><p>${para(i.description)}</p><p style="color:#8A8BA3;font-size:13px">${esc(i.name)} · ${esc(i.email)} · it is now on the shared board for every account</p>`, { href: `${APP_URL}/help/contact`, label: "See the board" })
  );
}

export function confirmToClient(r: { email: string; name: string; subject: string }) {
  const first = r.name.trim().split(/\s+/)[0] || "there";
  return send(
    r.email,
    `We've got your request: ${r.subject}`,
    wrap(`Thanks, ${first}. We've got it.`, `<p>Your request “${esc(r.subject)}” is in. We'll reply here by email and you can follow it any time under Help → Contact Support → My requests.</p>`, {
      href: `${APP_URL}/help/contact`,
      label: "See my requests",
    })
  );
}

export function notifyClientReply(r: { id: string; name: string; subject: string }, body: string) {
  return send(SUPPORT_INBOX, `[Support] Reply: ${r.subject}`, wrap(`${r.name} replied`, `<p>${para(body)}</p>`, { href: `${APP_URL}/support-desk?id=${r.id}`, label: "Open in the Support Desk" }));
}

export function notifySupportReply(r: { email: string; name: string; subject: string }, body: string, resolved: boolean) {
  const first = r.name.trim().split(/\s+/)[0] || "there";
  return send(
    r.email,
    `${resolved ? "Resolved" : "Reply"}: ${r.subject}`,
    wrap(`Hi ${first},`, `<p>${para(body)}</p>${resolved ? `<p style="color:#8A8BA3;font-size:13px">We've marked this resolved. Reply any time if you need more help.</p>` : ""}`, {
      href: `${APP_URL}/help/contact`,
      label: "Reply or see the conversation",
    })
  );
}
