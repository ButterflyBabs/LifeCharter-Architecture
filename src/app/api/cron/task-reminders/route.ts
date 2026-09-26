import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { REMINDER_LEADS, DEFAULT_LEAD_MIN, minutesUntil, inMinutes } from "@/lib/taskReminders";
import { timeInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

// Emails a reminder before a timed task is due. Runs every 5 minutes. For each
// client who has email reminders on, any open task with a time that falls
// within their lead time (default 30 min) and hasn't been reminded yet goes out
// in one email to the account owner, then is marked reminded so it never repeats.
// Changing a task's due time resets it. Needs RESEND_API_KEY; skips without it.
// Same CRON_SECRET convention as the other crons.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface TaskRow {
  id: number;
  title: string;
  due_at: string;
  time_kind: string;
  master_plan_id: string;
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ skipped: "RESEND_API_KEY not set" });

  const supabase = createServerClient();
  const now = new Date();
  const maxLead = Math.max(...REMINDER_LEADS);

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_at, time_kind, master_plan_id")
    .eq("due_has_time", true)
    .is("reminded_at", null)
    .neq("status", "done")
    .not("master_plan_id", "is", null)
    .gt("due_at", now.toISOString())
    .lte("due_at", new Date(now.getTime() + maxLead * 60000).toISOString())
    .order("due_at", { ascending: true })
    .limit(200);
  if (error) {
    console.error("task-reminders query:", error.message);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const byPlan = new Map<string, TaskRow[]>();
  for (const t of (data ?? []) as TaskRow[]) byPlan.set(t.master_plan_id, [...(byPlan.get(t.master_plan_id) ?? []), t]);

  let emailed = 0;
  let marked = 0;
  for (const [planId, tasks] of Array.from(byPlan.entries())) {
    const { data: plan } = await supabase.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
    if (!plan?.user_id) continue; // demo / unowned plans never get email
    const { data: prof } = await supabase
      .from("profiles")
      .select("email, full_name, timezone, timezone_chosen, task_reminder_email, task_reminder_lead_min")
      .eq("id", plan.user_id)
      .maybeSingle();
    if (!prof?.email || prof.task_reminder_email === false) continue;

    const lead = Number(prof.task_reminder_lead_min) || DEFAULT_LEAD_MIN;
    const due = tasks.filter((t) => minutesUntil(t.due_at, now) <= lead);
    if (due.length === 0) continue;

    const tz = prof.timezone || "America/Denver";
    const first = String(prof.full_name || "").trim().split(/\s+/)[0] || "there";
    const line = (t: TaskRow) => {
      const when = timeInTz(t.due_at, tz);
      const verb = t.time_kind === "scheduled" ? "At" : "Due by";
      return { verb, when, mins: Math.max(1, minutesUntil(t.due_at, now)), title: t.title };
    };
    const items = due.map(line);
    const subject =
      items.length === 1
        ? `${items[0].verb} ${items[0].when}: ${items[0].title.slice(0, 70)}`
        : `${items.length} tasks coming up — first ${items[0].verb.toLowerCase()} ${items[0].when}`;
    const rows = items
      .map(
        (i) => `<tr><td style="padding:12px 0;border-bottom:1px solid #EEE7DA">
          <div style="font-weight:600;color:#23255C">${esc(i.title)}</div>
          <div style="color:#6E6F8C;font-size:14px;margin-top:3px">${i.verb} ${esc(i.when)} · in ${esc(inMinutes(i.mins))}</div>
        </td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><body style="margin:0;background:#FBF7F0;font-family:Arial,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:28px 12px"><tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;padding:26px;border:1px solid #E4DACA">
        <tr><td style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700">LifeCharter Command Suite</td></tr>
        <tr><td style="font-size:22px;color:#23255C;padding:8px 0 4px;font-family:Georgia,serif">Hi ${esc(first)}, heads up</td></tr>
        <tr><td><table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}</table></td></tr>
        <tr><td style="padding-top:20px"><a href="${APP_URL}/tasks" style="display:inline-block;background:#23255C;color:#fff;font-weight:700;padding:11px 20px;border-radius:10px;text-decoration:none">Open my tasks</a></td></tr>
        <tr><td style="padding-top:20px;font-size:12px;color:#8A8BA3">You get this because task reminders are on. Change or turn them off in Settings → Profile.</td></tr>
      </table></td></tr></table></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: prof.email, subject, html }),
    });
    if (!res.ok) {
      console.error("task reminder email:", res.status, await res.text().catch(() => ""));
      continue; // leave unmarked so the next run retries
    }
    emailed += 1;
    await supabase.from("tasks").update({ reminded_at: now.toISOString() }).in("id", due.map((t) => t.id));
    marked += due.length;
  }

  return NextResponse.json({ candidates: data?.length ?? 0, emailed, marked });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
