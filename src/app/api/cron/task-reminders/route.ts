import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { REMINDER_LEADS, DEFAULT_LEAD_MIN, minutesUntil, inMinutes, upcomingRecurringToday } from "@/lib/taskReminders";
import { timeInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

// Emails a reminder before a timed task is due. Runs every 5 minutes. For each
// client who has email reminders on, any open task with a time that falls
// within their lead time (default 30 min) and hasn't been reminded yet goes out
// in one email, then is marked reminded so it never repeats. A task assigned to a
// team member goes to them (on their own reminder settings); the rest go to the owner.
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
  assignee_member_id: string | null;
}
interface Item {
  verb: string;
  when: string;
  mins: number;
  title: string;
  recurring: boolean;
  at: number;
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
    .select("id, title, due_at, time_kind, master_plan_id, assignee_member_id")
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

  // Plans that also have timed recurring tasks (checked per plan below).
  const { data: recurringPlans } = await supabase.from("recurring_tasks").select("master_plan_id").not("time_of_day", "is", null);
  for (const r of (recurringPlans ?? []) as { master_plan_id: string }[]) {
    if (!byPlan.has(r.master_plan_id)) byPlan.set(r.master_plan_id, []);
  }

  let emailed = 0;
  let marked = 0;

  // One reminder email. Returns true when it went out.
  const send = async (to: string, first: string, tz: string, items: Item[], forMember: boolean) => {
    const subject =
      items.length === 1
        ? `${items[0].verb} ${items[0].when}: ${items[0].title.slice(0, 70)}`
        : `${items.length} tasks coming up — first ${items[0].verb.toLowerCase()} ${items[0].when}`;
    const rows = items
      .map(
        (i) => `<tr><td style="padding:12px 0;border-bottom:1px solid #EEE7DA">
          <div style="font-weight:600;color:#23255C">${esc(i.title)}</div>
          <div style="color:#6E6F8C;font-size:14px;margin-top:3px">${i.verb} ${esc(i.when)} · in ${esc(inMinutes(i.mins))}${i.recurring ? " · recurring" : ""}</div>
        </td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><body style="margin:0;background:#FBF7F0;font-family:Arial,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:28px 12px"><tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;padding:26px;border:1px solid #E4DACA">
        <tr><td style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;font-weight:700">LifeCharter Command Suite</td></tr>
        <tr><td style="font-size:22px;color:#23255C;padding:8px 0 4px;font-family:Georgia,serif">Hi ${esc(first)}, heads up</td></tr>
        <tr><td><table width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}</table></td></tr>
        <tr><td style="padding-top:20px"><a href="${APP_URL}/tasks${forMember ? "?view=mine" : ""}" style="display:inline-block;background:#23255C;color:#fff;font-weight:700;padding:11px 20px;border-radius:10px;text-decoration:none">Open my tasks</a></td></tr>
        <tr><td style="padding-top:20px;font-size:12px;color:#8A8BA3">${forMember ? "You get this because these tasks are assigned to you." : "You get this because task reminders are on."} Change or turn them off in Settings → Profile.</td></tr>
      </table></td></tr></table></body></html>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error("task reminder email:", res.status, await res.text().catch(() => ""));
    else emailed += 1;
    return res.ok;
  };
  const line = (title: string, dueAt: string, kind: string, recurring: boolean, tz: string): Item => ({
    verb: kind === "scheduled" ? "At" : "Due by",
    when: timeInTz(dueAt, tz),
    mins: Math.max(1, minutesUntil(dueAt, now)),
    title,
    recurring,
    at: new Date(dueAt).getTime(),
  });

  for (const [planId, tasks] of Array.from(byPlan.entries())) {
    const { data: plan } = await supabase.from("client_master_plans").select("user_id").eq("id", planId).maybeSingle();
    if (!plan?.user_id) continue; // demo / unowned plans never get email
    const { data: prof } = await supabase
      .from("profiles")
      .select("email, full_name, timezone, timezone_chosen, task_reminder_email, task_reminder_lead_min")
      .eq("id", plan.user_id)
      .maybeSingle();
    const ownerTz = prof?.timezone || "America/Denver";

    // Assigned tasks go to the person they're assigned to, on their own settings.
    const assigned = tasks.filter((t) => t.assignee_member_id);
    const memberIds = Array.from(new Set(assigned.map((t) => t.assignee_member_id as string)));
    if (memberIds.length) {
      const { data: members } = await supabase.from("workspace_members").select("id, name, email, user_id, status").in("id", memberIds);
      for (const m of (members ?? []) as { id: string; name: string | null; email: string | null; user_id: string | null; status: string | null }[]) {
        if (!m.email || m.status === "inactive") continue;
        const { data: mp } = m.user_id
          ? await supabase.from("profiles").select("timezone, task_reminder_email, task_reminder_lead_min").eq("id", m.user_id).maybeSingle()
          : { data: null };
        if (mp?.task_reminder_email === false) continue;
        const lead = Number(mp?.task_reminder_lead_min) || DEFAULT_LEAD_MIN;
        const tz = mp?.timezone || ownerTz;
        const mine = assigned.filter((t) => t.assignee_member_id === m.id && minutesUntil(t.due_at, now) <= lead);
        if (!mine.length) continue;
        const items = mine.map((t) => line(t.title, t.due_at, t.time_kind, false, tz)).sort((a, b) => a.at - b.at);
        if (await send(m.email, String(m.name || "").trim().split(/\s+/)[0] || "there", tz, items, true)) {
          await supabase.from("tasks").update({ reminded_at: now.toISOString() }).in("id", mine.map((t) => t.id));
          marked += mine.length;
        }
      }
    }

    // The owner: unassigned tasks and recurring tasks.
    if (!prof?.email || prof.task_reminder_email === false) continue;
    const lead = Number(prof.task_reminder_lead_min) || DEFAULT_LEAD_MIN;
    const tz = ownerTz;
    const due = tasks.filter((t) => !t.assignee_member_id && minutesUntil(t.due_at, now) <= lead);

    // Timed recurring tasks due today inside the lead time, not yet reminded today.
    const recurringSoon = (await upcomingRecurringToday(planId, tz, now)).filter(
      (r) => minutesUntil(r.dueAt, now) <= lead
    );
    let recurringDue = recurringSoon;
    if (recurringSoon.length) {
      const { data: sent } = await supabase
        .from("recurring_task_reminders")
        .select("recurring_task_id")
        .eq("remind_on", recurringSoon[0].today)
        .in("recurring_task_id", recurringSoon.map((r) => r.id));
      const sentIds = new Set((sent ?? []).map((x) => x.recurring_task_id as string));
      recurringDue = recurringSoon.filter((r) => !sentIds.has(r.id));
    }
    if (due.length === 0 && recurringDue.length === 0) continue;

    const first = String(prof.full_name || "").trim().split(/\s+/)[0] || "there";
    const items = [
      ...due.map((t) => line(t.title, t.due_at, t.time_kind, false, tz)),
      ...recurringDue.map((r) => line(r.title, r.dueAt, r.timeKind, true, tz)),
    ].sort((a, b) => a.at - b.at);
    if (!(await send(prof.email, first, tz, items, false))) continue; // leave unmarked so the next run retries
    if (due.length) await supabase.from("tasks").update({ reminded_at: now.toISOString() }).in("id", due.map((t) => t.id));
    if (recurringDue.length) {
      await supabase
        .from("recurring_task_reminders")
        .upsert(recurringDue.map((r) => ({ recurring_task_id: r.id, remind_on: r.today })), { onConflict: "recurring_task_id,remind_on" });
    }
    marked += due.length + recurringDue.length;
  }

  return NextResponse.json({ candidates: data?.length ?? 0, emailed, marked });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
