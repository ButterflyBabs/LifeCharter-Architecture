import type { Accepted } from "@/lib/linkedinRequests";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Tells the people listed in the account's metadata.linkedinAcceptNotify who just accepted a connection request.
export type NotifyResult = { sent: boolean; status?: number; error?: string };
export async function notifyAccepted(to: string[], accepted: Accepted[]): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, error: "no RESEND_API_KEY on the server" };
  if (!to.length) return { sent: false, error: "nobody on the notify list" };
  if (!accepted.length) return { sent: false, error: "nobody newly accepted" };
  const n = accepted.length;
  const rows = accepted.map((a) => `<li style="margin:4px 0"><strong>${esc(a.name)}</strong> <span style="color:#8A8BA3">(${esc(a.board)})</span></li>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#23255C;max-width:520px">
    <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700;margin:0 0 8px">LifeCharter Command Suite</p>
    <p style="font-size:20px;font-family:Georgia,serif;margin:0 0 8px">${n === 1 ? "A LinkedIn request was accepted" : `${n} LinkedIn requests were accepted`}</p>
    <ul style="padding-left:18px">${rows}</ul>
    <p>${n === 1 ? "Their card has" : "Their cards have"} moved to Connected: send the invite. <a href="${APP_URL}/dm-pipeline" style="color:#2E7C83">Open the pipeline</a></p>
  </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject: n === 1 ? `${accepted[0].name} accepted your LinkedIn request` : `${n} people accepted your LinkedIn requests`, html }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("linkedin accepted email:", res.status, t);
    return { sent: false, status: res.status, error: t.slice(0, 300) };
  }
  return { sent: true, status: res.status };
}
