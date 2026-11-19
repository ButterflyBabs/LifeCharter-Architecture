// The email a lead gets when they finish the Mini Command Audit. Pure, so it can be previewed and tested.
import type { AuditResult } from "@/lib/miniAudit";

const clean = (s: string) => s.replace(/[<>&"]/g, "");

export function miniAuditEmail(input: { name: string; origin: string; token: string; result: AuditResult }): { subject: string; html: string; text: string } {
  const first = clean(input.name.split(" ")[0] || "");
  const link = `${input.origin}/mini-command-audit/results/${input.token}`;
  const signup = `${input.origin}/masterclass-signup`;
  const start = input.result.start.map((p) => clean(p.name));
  const startLine = start.length === 2 ? `Your two best places to start are ${start[0]} and ${start[1]}.` : "Your scores for all 12 areas of the business are waiting for you.";
  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8923F;font-weight:bold">LifeCharter Command Suite</td></tr>
    <tr><td style="font-size:26px;color:#1a2b4a;padding:8px 0 12px">Your Mini Command Audit results</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">${first ? `Hi ${first},<br><br>` : ""}Thank you for taking the Mini Command Audit. ${startLine}<br><br>Your results are saved at the link below, so you can come back to them any time and go deeper whenever you like.</td></tr>
    <tr><td style="padding:24px 0 8px"><a href="${link}" style="display:inline-block;background:#1a2b4a;color:#F8F5F0;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">See my results</a></td></tr>
    <tr><td style="border-top:1px solid #E6DDCB;padding-top:22px;font-family:Georgia,serif;font-size:19px;color:#1a2b4a">Want to work on your lowest areas with me?</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46;padding-top:8px">Join the free Command Shift MasterClass. It is taught live, and one registration works for every session.</td></tr>
    <tr><td style="padding:16px 0 8px"><a href="${signup}" style="display:inline-block;background:#B8923F;color:#1a2b4a;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Save my seat</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#7F8894;padding-top:14px">Questions? Just reply, or write to support@lccommandsuite.com.</td></tr>
    <tr><td style="font-size:17px;font-style:italic;color:#1a2b4a;padding-top:22px">Head up - Wings out<br>Babs 🦋</td></tr>
  </table></td></tr></table></body></html>`;
  return {
    subject: "Your Mini Command Audit results",
    html,
    text: `${first ? `Hi ${first},\n\n` : ""}Thank you for taking the Mini Command Audit. ${startLine}\n\nYour results are saved here, so you can come back any time and go deeper whenever you like: ${link}\n\nWant to work on your lowest areas with me? Join the free Command Shift MasterClass (one registration works for every session): ${signup}\n\nQuestions? Just reply, or write to support@lccommandsuite.com.\n\nHead up - Wings out\nBabs`,
  };
}
