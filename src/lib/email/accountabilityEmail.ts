// Accountability-partner emails (invitation, nudges and reminders), sent through
// Resend from support@lccommandsuite.com with replies to support@amilynnecarroll.com,
// the same sender setup as the team-invite email. Never throws: returns false if
// email isn't configured or the send fails, so the in-app feed still shows everything.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendAccEmail(opts: { to: string; subject: string; heading: string; body: string; cta: string; link: string; footnote?: string; attachments?: { filename: string; content: string; contentType: string }[] }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return false;
  const paragraphs = opts.body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8923F;font-weight:bold">Accountability partner</td></tr>
    <tr><td style="font-size:25px;color:#1a2b4a;padding:8px 0 14px">${esc(opts.heading)}</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">${paragraphs}</td></tr>
    <tr><td style="padding:14px 0 8px"><a href="${opts.link}" style="display:inline-block;background:#1a2b4a;color:#F8F5F0;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">${esc(opts.cta)}</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#7F8894;padding-top:14px">${esc(opts.footnote || "You can pause or end this partnership any time from the page. Questions? Write to support@amilynnecarroll.com.")}</td></tr>
  </table></td></tr></table></body></html>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "LifeCharter Command Suite <support@lccommandsuite.com>",
        to: opts.to,
        reply_to: "support@amilynnecarroll.com",
        subject: opts.subject,
        html,
        ...(opts.attachments?.length ? { attachments: opts.attachments.map((a) => ({ filename: a.filename, content: a.content, content_type: a.contentType })) } : {}),
        text: `${opts.heading}\n\n${opts.body}\n\n${opts.cta}: ${opts.link}`,
      }),
    });
    if (!res.ok) console.error("accountability email:", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("accountability email:", (e as Error).message);
    return false;
  }
}
