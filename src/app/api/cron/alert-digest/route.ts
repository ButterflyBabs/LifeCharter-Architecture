import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isEmailWorthy, syncNotifications } from "@/lib/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Once a day, emails each owner the important alerts they haven't been emailed
// about yet (score drops, slipped goals, stalled pipeline, a missed rhythm, bills
// coming due, a review that's due). Each alert is emailed once; the bell keeps
// showing it until it's resolved or dismissed. Owners turn it off in
// Settings → Profile. Same CRON_SECRET convention as the other crons.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.ALERT_EMAIL_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });

  const supabase = createServerClient();
  const { data: plans } = await supabase.from("client_master_plans").select("id, user_id").not("user_id", "is", null).limit(1000);

  let emailed = 0;
  for (const plan of (plans ?? []) as { id: string; user_id: string }[]) {
    const { data: prof } = await supabase.from("profiles").select("email, full_name, alert_email").eq("id", plan.user_id).maybeSingle();
    if (!prof?.email || prof.alert_email === false) continue;

    let rows;
    try {
      rows = await syncNotifications(plan.id);
    } catch (e) {
      console.error("alert-digest sync:", plan.id, e);
      continue;
    }
    const fresh = rows.filter((r) => isEmailWorthy(r.nkey) && !r.emailed_at);
    if (!fresh.length) continue;

    const first = String(prof.full_name || "").trim().split(/\s+/)[0] || "there";
    const subject = fresh.length === 1 ? fresh[0].title : `${fresh.length} things need your attention`;
    const items = fresh
      .map(
        (r) => `<tr><td style="padding:12px 0;border-bottom:1px solid #EEE7DA">
          <a href="${APP_URL}${esc(r.href || "/")}" style="font-weight:600;color:#23255C;text-decoration:none">${esc(r.title)}</a>
          <div style="color:#6E6F8C;font-size:14px;margin-top:3px">${esc(r.body || "")}</div>
        </td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><body style="margin:0;background:#FBF7F0;font-family:Arial,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:28px 12px"><tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;padding:26px;border:1px solid #E4DACA">
        <tr><td style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700">LifeCharter Command Suite</td></tr>
        <tr><td style="font-size:22px;color:#23255C;padding:8px 0 4px;font-family:Georgia,serif">Hi ${esc(first)}, a quick heads-up</td></tr>
        <tr><td style="font-size:15px;color:#4A4B6A;padding-bottom:6px">Your Suite noticed ${fresh.length === 1 ? "something" : "a few things"} worth your attention:</td></tr>
        <tr><td><table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${items}</table></td></tr>
        <tr><td style="padding-top:20px"><a href="${APP_URL}/" style="display:inline-block;background:#23255C;color:#fff;font-weight:700;padding:11px 20px;border-radius:10px;text-decoration:none">Open my Suite</a></td></tr>
        <tr><td style="padding-top:20px;font-size:12px;color:#8A8BA3">You get this because alert emails are on. Turn them off in Settings → Profile.</td></tr>
      </table></td></tr></table></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: prof.email, reply_to: "support@amilynnecarroll.com", subject, html }),
    });
    if (!res.ok) {
      console.error("alert-digest email:", res.status, await res.text().catch(() => ""));
      continue; // not marked, so tomorrow retries
    }
    emailed += 1;
    await supabase.from("notifications").update({ emailed_at: new Date().toISOString() }).in("id", fresh.map((r) => r.id));
  }
  return NextResponse.json({ plans: (plans ?? []).length, emailed });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
