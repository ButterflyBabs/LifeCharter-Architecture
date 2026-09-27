// Welcome email for a brand-new Collective member, sent right after /api/community/join
// creates their account. Same look as the invitation email. Never throws: a failed send is
// logged and the join still succeeds (they also get the in-app welcome DM).

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendCollectiveWelcome({ email, name, base }: { email: string; name: string; base: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEnv = process.env.COMMUNITY_EMAIL_FROM;
  if (!resendKey || !fromEnv) {
    console.error("welcome email: RESEND_API_KEY / COMMUNITY_EMAIL_FROM not set");
    return false;
  }
  const address = fromEnv.match(/<([^>]+)>/)?.[1] ?? fromEnv;
  const first = name.split(" ")[0];
  const startHere = `${base}/community/s/start-here`;
  const home = `${base}/community`;
  const help = `${base}/community/help`;

  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="padding-bottom:6px"><img src="${base}/collective-logo.png" width="240" alt="The LifeCharter Collective" style="display:block;width:240px;max-width:100%;height:auto;border:0"></td></tr>
    <tr><td style="font-size:27px;color:#1F2B3A;padding:8px 0 12px">You're in. Welcome home.</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">
      ${first ? `Hi ${esc(first)},<br><br>` : ""}I'm so glad you're here. The Collective is where we set our intention each week, share what moved, and build alongside people who understand the work. You don't have to do this alone anymore.
    </td></tr>
    <tr><td style="padding:24px 0 8px"><a href="${startHere}" style="display:inline-block;background:#D4AF63;color:#1F2B3A;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Open Start Here</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:14px;line-height:1.65;color:#2E3A46;border-top:1px solid #F1EBDF;padding-top:16px;margin-top:12px">
      <strong style="color:#1F2B3A">Your first three steps</strong><br>
      1. Introduce yourself in Start Here.<br>
      2. Set this week&rsquo;s intention in your private Alignment Journal.<br>
      3. Join the next live Alignment Anchor (it&rsquo;s on the Events page).
    </td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:14px;line-height:1.65;color:#2E3A46;padding-top:16px">
      <strong style="color:#1F2B3A">Keep the Collective on your phone</strong><br>
      Open <a href="${home}" style="color:#2E7C83">lccommandsuite.com/community</a> on your phone, then choose <em>Add to Home Screen</em> (Safari: the Share button; Chrome: the &#8942; menu). Turn on notifications when it asks, so you never miss a reply or an event.
    </td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#56616E;padding-top:16px">Questions? The <a href="${help}" style="color:#2E7C83">Help &amp; FAQ</a> page has quick answers, or just reply to this email.</td></tr>
    <tr><td style="font-size:17px;font-style:italic;color:#1F2B3A;padding-top:22px">Head up - Wings out<br>Babs 🦋</td></tr>
  </table></td></tr></table></body></html>`;

  const text = `${first ? `Hi ${first},\n\n` : ""}You're in. Welcome to The LifeCharter Collective.\n\nStart here: ${startHere}\n\nYour first three steps:\n1. Introduce yourself in Start Here.\n2. Set this week's intention in your private Alignment Journal.\n3. Join the next live Alignment Anchor (it's on the Events page).\n\nKeep the Collective on your phone: open ${home} on your phone and choose Add to Home Screen, then turn on notifications.\n\nQuestions? ${help}, or just reply to this email.\n\nHead up - Wings out\nBabs 🦋`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `The LifeCharter Collective <${address}>`,
        to: email,
        reply_to: "support@amilynnecarroll.com",
        subject: "Welcome to The LifeCharter Collective",
        html,
        text,
      }),
    });
    if (!res.ok) console.error("welcome email:", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("welcome email:", (e as Error).message);
    return false;
  }
}
