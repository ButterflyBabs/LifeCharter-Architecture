import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkConnection, type Connection } from "@/lib/booking/connections";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 30 minutes: tests every booking calendar connection (Google and Microsoft). A connection that has stopped
// working is remembered (broken_at) and its account holder is emailed once, with the one-click reconnect link, then
// reminded every 3 days while it stays broken. A connection that works again is cleared. The bell shows it too
// (src/lib/alerts.ts). Same CRON_SECRET convention as the other crons.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.ALERT_EMAIL_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const REMIND_MS = 3 * 86_400_000;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = createServerClient();
  const { data: conns } = await db.from("booking_connections").select("*").limit(500);
  const { data: hosts } = await db.from("booking_hosts").select("id, name, master_plan_id, connect_key, active");
  const hostBy = new Map((hosts ?? []).map((h) => [h.id as string, h]));

  let checked = 0, broke = 0, fixed = 0;
  for (const c of (conns ?? []) as Connection[]) {
    const host = hostBy.get(c.host_id);
    if (!host || host.active === false) continue;
    checked++;
    const r = await checkConnection(c).catch((e) => ({ ok: false, reason: `Check failed: ${String(e).slice(0, 120)}` }));
    if (!r.ok && !c.broken_at) {
      await db.from("booking_connections").update({ broken_at: new Date().toISOString(), broken_reason: r.reason }).eq("id", c.id);
      c.broken_at = new Date().toISOString();
      broke++;
    } else if (r.ok && c.broken_at) {
      await db.from("booking_connections").update({ broken_at: null, broken_reason: null, alerted_at: null }).eq("id", c.id);
      c.broken_at = null;
      fixed++;
    }
  }

  // Tell each account holder about connections still broken and not yet (or not recently) alerted.
  const due = ((conns ?? []) as Connection[]).filter((c) => c.broken_at && (!c.alerted_at || Date.now() - new Date(c.alerted_at).getTime() > REMIND_MS));
  const byPlan = new Map<string, Connection[]>();
  for (const c of due) {
    const planId = hostBy.get(c.host_id)?.master_plan_id as string | undefined;
    if (planId) byPlan.set(planId, [...(byPlan.get(planId) ?? []), c]);
  }
  const resendKey = process.env.RESEND_API_KEY;
  let emailed = 0;
  for (const [planId, list] of Array.from(byPlan.entries())) {
    const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
    if (!plan?.user_id || !resendKey) continue;
    const { data: prof } = await db.from("profiles").select("email, full_name").eq("id", plan.user_id).maybeSingle();
    if (!prof?.email) continue;
    const first = String(prof.full_name || "").trim().split(/\s+/)[0] || "there";
    const rows = list
      .map((c: Connection) => {
        const h = hostBy.get(c.host_id)!;
        const link = `${APP_URL}/book/connect/${h.id}?k=${h.connect_key}`;
        const what = `${c.provider === "google" ? "Google" : "Microsoft"} calendar${c.email ? ` (${c.email})` : ""}`;
        return `<tr><td style="padding:12px 0;border-bottom:1px solid #EEE7DA"><div style="font-weight:600;color:#23255C">${esc(what)}</div><div style="color:#6E6F8C;font-size:14px;margin:3px 0 8px">For ${esc(String(h.name))}. ${esc(c.broken_reason || "It stopped connecting.")}</div><a href="${link}" style="display:inline-block;background:#23255C;color:#fff;font-weight:700;padding:9px 16px;border-radius:10px;text-decoration:none;font-size:14px">Reconnect this calendar</a></td></tr>`;
      })
      .join("");
    const html = `<!doctype html><html><body style="margin:0;background:#FBF7F0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;padding:26px;border:1px solid #E4DACA">
<tr><td style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700">LifeCharter Command Suite</td></tr>
<tr><td style="font-size:22px;color:#23255C;padding:8px 0 4px;font-family:Georgia,serif">Hi ${esc(first)}, a calendar needs reconnecting</td></tr>
<tr><td style="font-size:15px;color:#4A4B6A;padding-bottom:6px;line-height:1.55">${list.length === 1 ? "A calendar connected to your booking pages has stopped working." : "Some calendars connected to your booking pages have stopped working."} Until it is reconnected, your booking pages may show no open times, so nobody can book with you. Nothing is lost: reconnecting takes about a minute.</td></tr>
<tr><td><table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}</table></td></tr>
<tr><td style="padding-top:18px;font-size:12px;color:#8A8BA3">The Suite checks your calendar connections every 30 minutes and tells you the moment one breaks.</td></tr>
</table></td></tr></table></body></html>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: prof.email, subject: list.length === 1 ? "Your calendar connection needs reconnecting" : "Some of your calendar connections need reconnecting", html }),
    }).catch(() => null);
    if (res?.ok) {
      emailed++;
      await db.from("booking_connections").update({ alerted_at: new Date().toISOString() }).in("id", list.map((c: Connection) => c.id));
    }
  }
  return NextResponse.json({ checked, broke, fixed, emailed });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
