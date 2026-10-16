import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every 5 minutes: a reminder that has come due is emailed once to the account holder (the bell and the cards show
// it on their own). Respects the same "email reminders" switch as task reminders (profiles.task_reminder_email).
// Marked notified_at so it never repeats; changing the time or snoozing clears the mark. Same CRON_SECRET convention.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });
  const db = createServerClient();
  const now = new Date();
  const { data } = await db
    .from("reminders")
    .select("id, master_plan_id, title, notes, remind_at, created_by")
    .eq("status", "open")
    .is("notified_at", null)
    .lte("remind_at", now.toISOString())
    .gte("remind_at", new Date(now.getTime() - 7 * 86_400_000).toISOString())
    .order("remind_at")
    .limit(300);
  // A reminder goes to whoever made it when that is a team member (their own reminders); otherwise to the account holder.
  const makers = Array.from(new Set(((data ?? []) as { created_by: string | null }[]).map((r) => r.created_by).filter(Boolean))) as string[];
  const memberIds = new Set<string>();
  if (makers.length) {
    const { data: mem } = await db.from("workspace_members").select("user_id").in("user_id", makers);
    for (const m of (mem ?? []) as { user_id: string }[]) memberIds.add(m.user_id);
  }
  const byPlan = new Map<string, { id: string; title: string; notes: string | null; remind_at: string }[]>();
  const recipient = new Map<string, string | null>();
  for (const r of (data ?? []) as { id: string; master_plan_id: string; title: string; notes: string | null; remind_at: string; created_by: string | null }[]) {
    const to = r.created_by && memberIds.has(r.created_by) ? r.created_by : null;
    const key = `${r.master_plan_id}|${to ?? ""}`;
    recipient.set(key, to);
    byPlan.set(key, [...(byPlan.get(key) ?? []), r]);
  }
  let emailed = 0;
  let skipped = 0;
  for (const [key, list] of Array.from(byPlan.entries())) {
    const planId = key.split("|")[0];
    const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
    const toUser = recipient.get(key) ?? plan?.user_id;
    if (!toUser) { skipped += list.length; continue; } // demo / unowned plans never get email
    const { data: prof } = await db.from("profiles").select("email, full_name, timezone, task_reminder_email").eq("id", toUser).maybeSingle();
    if (!prof?.email || prof.task_reminder_email === false) {
      // They turned email reminders off: the bell and cards still show it. Mark so it is not re-checked every run.
      await db.from("reminders").update({ notified_at: now.toISOString() }).in("id", list.map((r) => r.id));
      skipped += list.length;
      continue;
    }
    const tz = prof.timezone || "America/Denver";
    const first = String(prof.full_name || "").trim().split(/\s+/)[0] || "there";
    const rows = list
      .map((r) => {
        const at = new Date(r.remind_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz });
        return `<tr><td style="padding:12px 0;border-bottom:1px solid #EEE7DA"><div style="font-weight:600;color:#23255C">${esc(r.title)}</div>${r.notes ? `<div style="color:#4A4B6A;font-size:14px;margin-top:3px;white-space:pre-line">${esc(r.notes)}</div>` : ""}<div style="color:#6E6F8C;font-size:13px;margin-top:3px">Set for ${esc(at)}</div></td></tr>`;
      })
      .join("");
    const subject = list.length === 1 ? `Reminder: ${list[0].title.slice(0, 80)}` : `${list.length} reminders are due`;
    const html = `<!doctype html><html><body style="margin:0;background:#FBF7F0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:28px 12px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;padding:26px;border:1px solid #E4DACA">
<tr><td style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700">LifeCharter Command Suite</td></tr>
<tr><td style="font-size:22px;color:#23255C;padding:8px 0 4px;font-family:Georgia,serif">Hi ${esc(first)}, a reminder you set</td></tr>
<tr><td><table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}</table></td></tr>
<tr><td style="padding-top:20px"><a href="${APP_URL}/reminders" style="display:inline-block;background:#23255C;color:#fff;font-weight:700;padding:11px 20px;border-radius:10px;text-decoration:none;font-size:14px">Open Reminders</a></td></tr>
<tr><td style="padding-top:18px;font-size:12px;color:#8A8BA3">You can mark it done, or snooze it, on the Reminders page. Turn these emails off in Settings under task reminders.</td></tr>
</table></td></tr></table></body></html>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: prof.email, subject, html }),
    }).catch(() => null);
    if (res?.ok) {
      emailed += 1;
      await db.from("reminders").update({ notified_at: now.toISOString() }).in("id", list.map((r) => r.id));
    }
  }
  return NextResponse.json({ due: data?.length ?? 0, emailed, skipped });
}
export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
