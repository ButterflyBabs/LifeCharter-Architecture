// The email a lead gets when they finish the Business Health Check. Pure, so it can be previewed and tested.
// The check saves no results page, so the scores for all six categories are in the email itself. No pricing, ever.
import type { HealthResult } from "@/lib/healthCheck";

const clean = (s: string) => s.replace(/[<>&"]/g, "");

export function healthCheckEmail(input: { name: string; origin: string; result: HealthResult }): { subject: string; html: string; text: string } {
  const first = clean(input.name.split(" ")[0] || "");
  const r = input.result;
  const retake = `${input.origin}/business-health-check`;
  const book = `${input.origin}/schedule/masterclass`;
  const gaps = r.gaps.map((g) => clean(g.name));
  const startLine = `Your two biggest gaps are ${gaps[0]} and ${gaps[1]}, and your strongest area is ${clean(r.strongest.name)}.`;
  const rows = r.categories
    .map((c) => `<tr><td style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;color:#2E3A46">${c.icon} ${clean(c.name)}</td><td align="right" style="padding:6px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#1a2b4a">${c.pct}% · ${c.tier.label}</td></tr>`)
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#FAF8F3;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F3;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#fff;border-radius:18px;padding:30px;border:1px solid #E6DDCB">
    <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B8923F;font-weight:bold">LifeCharter Command Suite</td></tr>
    <tr><td style="font-size:26px;color:#1a2b4a;padding:8px 0 12px">Your Business Health Check results</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46">${first ? `Hi ${first},<br><br>` : ""}Thank you for taking the Business Health Check. Your overall score is <b>${r.overall}%</b> (${clean(r.grade.label)}). ${startLine}</td></tr>
    <tr><td style="padding:18px 0 4px"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E6DDCB;border-bottom:1px solid #E6DDCB">${rows}</table></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46;padding-top:14px">The place to start is <b>${clean(r.priorities[0]?.title ?? "your lowest area")}</b>. Your full report, with your action plan, is on the page you just finished. You can retake the check in a few months to see what has moved.</td></tr>
    <tr><td style="padding:20px 0 8px"><a href="${retake}" style="display:inline-block;background:#1a2b4a;color:#F8F5F0;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Take it again</a></td></tr>
    <tr><td style="border-top:1px solid #E6DDCB;padding-top:22px;font-family:Georgia,serif;font-size:19px;color:#1a2b4a">Want help closing these gaps?</td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46;padding-top:8px">Book an Executive Consultation. We will look at your scores together and talk through the right next step for your business.</td></tr>
    <tr><td style="padding:16px 0 8px"><a href="${book}" style="display:inline-block;background:#B8923F;color:#1a2b4a;font-family:Arial,sans-serif;font-weight:700;padding:14px 26px;border-radius:10px;text-decoration:none">Book my Executive Consultation</a></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:12.5px;line-height:1.6;color:#7F8894;padding-top:14px">Questions? Just reply, or write to support@lccommandsuite.com.</td></tr>
    <tr><td style="font-size:17px;font-style:italic;color:#1a2b4a;padding-top:22px">Head up - Wings out<br>Babs 🦋</td></tr>
  </table></td></tr></table></body></html>`;
  const text = `${first ? `Hi ${first},\n\n` : ""}Thank you for taking the Business Health Check. Your overall score is ${r.overall}% (${r.grade.label}). ${startLine}\n\n${r.categories.map((c) => `${c.name}: ${c.pct}% (${c.tier.label})`).join("\n")}\n\nThe place to start is: ${r.priorities[0]?.title ?? "your lowest area"}. Your full report and action plan are on the page you just finished. Retake it any time: ${retake}\n\nWant help closing these gaps? Book an Executive Consultation and we will look at your scores together: ${book}\n\nQuestions? Just reply, or write to support@lccommandsuite.com.\n\nHead up - Wings out\nBabs`;
  return { subject: "Your Business Health Check results", html, text };
}
