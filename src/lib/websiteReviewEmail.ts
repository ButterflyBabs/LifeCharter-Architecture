// The email a client gets when their Website Alignment Review is published. Pure, so the owner's Preview shows exactly what is sent.

const clean = (s: string) => s.replace(/[<>&]/g, "");

export function reviewReadyEmail(input: { name: string; website: string; origin: string }): { subject: string; html: string; text: string } {
  const first = clean(input.name.split(" ")[0] || "");
  const site = clean(input.website);
  const link = `${input.origin}/website-review`;
  const connect = `${input.origin}/book/sip-and-soul`; // the Sip and Soul calendar: a 30-minute conversation with Babs
  const what = "with the five changes that matter most, a Keywords and SEO section, and how your own AI Assistant can help you carry them out";
  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8923F;font-weight:bold">LifeCharter Command Suite</td></tr>
    <tr><td style="font-size:26px;color:#1a2b4a;padding:8px 0 12px">Your Website Alignment Review is ready${site ? `<br><span style="font-size:15px;font-family:Arial,sans-serif;color:#7F8894">for ${site}</span>` : ""}</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">${first ? `Hi ${first},<br><br>` : ""}We've looked at your website against the positioning, voice and offer you're building in Command Suite. Your Review is waiting in your account, ${what}.</td></tr>
    <tr><td style="padding:24px 0 8px"><a href="${link}" style="display:inline-block;background:#1a2b4a;color:#F8F5F0;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Read your Review</a></td></tr>
    <tr><td style="border-top:1px solid #E6DDCB;padding-top:22px;font-family:Georgia,serif;font-size:19px;color:#1a2b4a">Would you like to connect with Babs on what you've learned here?</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46;padding-top:8px">Book a relaxed 30-minute Sip and Soul conversation on Zoom. Bring your Review and whatever is on your heart. Schedule your connection today.</td></tr>
    <tr><td style="padding:16px 0 8px"><a href="${connect}" style="display:inline-block;background:#B8923F;color:#1a2b4a;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Connect with Babs</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#7F8894;padding-top:14px">Questions, or want to talk it through? Just reply, or write to support@lccommandsuite.com.</td></tr>
    <tr><td style="font-size:17px;font-style:italic;color:#1a2b4a;padding-top:22px">Head up - Wings out<br>Babs 🦋</td></tr>
  </table></td></tr></table></body></html>`;
  return {
    subject: site ? `Your Website Alignment Review for ${site} is ready` : "Your Website Alignment Review is ready",
    html,
    text: `${first ? `Hi ${first},\n\n` : ""}Your Website Alignment Review${site ? ` for ${site}` : ""} is ready in your Command Suite account, ${what}.\n\nRead it here: ${link}\n\nWould you like to connect with Babs on what you've learned here? Book a relaxed 30-minute Sip and Soul conversation on Zoom and schedule your connection today: ${connect}\n\nQuestions? Reply, or write to support@lccommandsuite.com.\n\nHead up - Wings out\nBabs 🦋`,
  };
}
