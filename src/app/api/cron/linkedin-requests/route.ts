import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import * as microsoft from "@/lib/microsoft";
import { syncLinkedInRequests, type Accepted } from "@/lib/linkedinRequests";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Tells the people listed in the account's metadata.linkedinAcceptNotify who just accepted a connection request.
async function notifyAccepted(to: string[], accepted: Accepted[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.length || !accepted.length) return;
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
  if (!res.ok) console.error("linkedin accepted email:", res.status, await res.text().catch(() => ""));
}

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Every 15 minutes: for each account that switched on "add LinkedIn connection requests from my inbox", read the
// connected Microsoft 365 inbox for LinkedIn invitation emails and add each new person to the outreach pipeline.
// Same CRON_SECRET convention as the other crons.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data: plans } = await db.from("client_master_plans").select("id, user_id, metadata").eq("metadata->>linkedinRequestsOn", "true").not("user_id", "is", null).limit(300);
  let accounts = 0;
  let added = 0;
  let acceptedCount = 0;
  let failed = 0;
  for (const p of (plans ?? []) as { id: string; user_id: string; metadata: Record<string, unknown> | null }[]) {
    try {
      const { data: prof } = await db.from("profiles").select("timezone").eq("id", p.user_id).maybeSingle();
      const conns = await microsoft.listConnections({ ownerId: p.user_id });
      const accepted: Accepted[] = [];
      for (const c of conns) {
        const token = await microsoft.getValidAccessToken({ ownerId: p.user_id, accountKey: c.accountKey });
        if (!token) continue;
        const r = await syncLinkedInRequests(db as never, p.id, token, (prof?.timezone as string | null) || "America/Denver");
        added += r.added;
        accepted.push(...r.accepted);
      }
      acceptedCount += accepted.length;
      const notify = Array.isArray(p.metadata?.linkedinAcceptNotify) ? (p.metadata!.linkedinAcceptNotify as unknown[]).filter((x): x is string => typeof x === "string" && x.includes("@")) : [];
      await notifyAccepted(notify, accepted).catch((e) => console.error("linkedin accepted notify:", (e as Error).message));
      accounts++;
      await db.from("client_master_plans").update({ metadata: { ...(p.metadata ?? {}), linkedinRequestsCheckedAt: new Date().toISOString() } }).eq("id", p.id);
    } catch (e) {
      failed++;
      console.error("linkedin-requests:", p.id, (e as Error).message);
    }
  }
  return NextResponse.json({ accounts, added, accepted: acceptedCount, failed });
}
export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
