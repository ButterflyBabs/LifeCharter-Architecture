import { createHmac, timingSafeEqual } from "crypto";

// Turns a sequence step into a branded email (HTML + plain text) with the
// legally required footer: business address and a one-click unsubscribe.

export const BUSINESS_ADDRESS = "Sacred Kaleidoscope Community LLC · 5787 S Odessa Street · Centennial, Colorado 80015";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const SIGN_OFF_HTML = "Head up - Wings out<br>Babs 🦋";
const SIGN_OFF_TEXT = "Head up - Wings out\nBabs 🦋";

const secret = () => process.env.SEQUENCE_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
const sign = (id: string) => createHmac("sha256", secret()).update(`unsub:${id}`).digest("base64url").slice(0, 32);

export function unsubscribeToken(contactId: string) {
  return `${contactId}.${sign(contactId)}`;
}
export function readUnsubscribeToken(token: string): string | null {
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}
export const unsubscribeUrl = (contactId: string) => `${APP_URL}/unsubscribe?t=${encodeURIComponent(unsubscribeToken(contactId))}`;
export const unsubscribeApiUrl = (contactId: string) => `${APP_URL}/api/unsubscribe?t=${encodeURIComponent(unsubscribeToken(contactId))}`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const inline = (s: string) => esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,)])/g, '<a href="$1" style="color:#2E7C83">$1</a>').replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

// Plain text with blank-line paragraphs, "- " bullets and "1. " steps -> email-safe HTML.
export function toHtml(text: string) {
  const P = 'style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3A46"';
  const L = 'style="margin:0 0 14px;padding-left:22px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46"';
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").filter((l) => l.trim() !== "");
      if (!lines.length) return "";
      if (lines.every((l) => /^- /.test(l))) return `<ul ${L}>${lines.map((b) => `<li style="margin-bottom:4px">${inline(b.slice(2))}</li>`).join("")}</ul>`;
      if (lines.every((l) => /^\d+\. /.test(l))) return `<ol start="${parseInt(lines[0], 10)}" ${L}>${lines.map((b) => `<li style="margin-bottom:6px">${inline(b.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`;
      if (lines.length > 1 && lines.slice(1).every((l) => /^- /.test(l)))
        return `<p ${P.replace("14px", "6px")}>${inline(lines[0])}</p><ul ${L}>${lines.slice(1).map((b) => `<li style="margin-bottom:4px">${inline(b.slice(2))}</li>`).join("")}</ul>`;
      if (/^## /.test(lines[0])) return `<h2 style="margin:6px 0 10px;font-family:Georgia,serif;font-size:20px;color:#0F5B63">${inline(lines[0].slice(3))}</h2>${lines.length > 1 ? `<p ${P}>${lines.slice(1).map(inline).join("<br>")}</p>` : ""}`;
      return `<p ${P}>${lines.map(inline).join("<br>")}</p>`;
    })
    .join("");
}

export interface RenderInput {
  brand: string;
  subject: string;
  preview?: string | null;
  body: string;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  contact: { id: string; first_name: string | null };
}

export function renderStep(r: RenderInput) {
  const first = (r.contact.first_name || "").trim();
  const fill = (s: string) => s.replace(/\{\{\s*first_name\s*\}\}/gi, first || "friend").replace(/\{\{\s*greeting\s*\}\}/gi, first ? `Hi ${first},` : "Hi there,");
  const subject = fill(r.subject);
  const body = fill(r.body);
  const unsub = unsubscribeUrl(r.contact.id);
  const button = r.buttonLabel && r.buttonUrl ? { label: fill(r.buttonLabel), url: r.buttonUrl } : null;
  const html = `<!doctype html><html><body style="margin:0;background:#FBF8F1">
<span style="display:none;max-height:0;overflow:hidden">${esc(fill(r.preview || ""))}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F1;padding:28px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff;border-radius:18px;padding:30px;border:1px solid #EADFCF">
  <tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C76F56;font-weight:bold;padding-bottom:14px">${esc(r.brand)}</td></tr>
  <tr><td>${toHtml(body)}</td></tr>
  ${button ? `<tr><td style="padding:6px 0 18px"><a href="${esc(button.url)}" style="display:inline-block;background:#0F5B63;color:#fff;font-family:Arial,sans-serif;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:999px;text-decoration:none">${esc(button.label)}</a></td></tr>` : ""}
  <tr><td style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#0F5B63;padding-top:6px">${SIGN_OFF_HTML}</td></tr>
  <tr><td style="font-family:Arial,sans-serif;font-size:11.5px;line-height:1.6;color:#8A8F99;padding-top:24px;border-top:1px solid #F0E8DA">
    Questions? Just reply, or write to support@amilynnecarroll.com.<br>
    ${esc(BUSINESS_ADDRESS)}<br>
    <a href="${unsub}" style="color:#8A8F99">Unsubscribe</a> from these emails.
  </td></tr>
</table></td></tr></table></body></html>`;
  const text = `${body}${button ? `\n\n${button.label}: ${button.url}` : ""}\n\n${SIGN_OFF_TEXT}\n\n—\nQuestions? Reply, or write to support@amilynnecarroll.com.\n${BUSINESS_ADDRESS}\nUnsubscribe: ${unsub}`;
  return { subject, html, text };
}
