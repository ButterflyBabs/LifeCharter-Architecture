import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { zonedToUtcISO } from "@/lib/tz";
import { DIGEST_HOUR, TEAM_DAILY_TASKS, TEAM_TZ, countsLine, groupDigest, isWeekday, mountainParts, niceDay, tallyDms, type DigestTask } from "@/lib/teamDailyTasks";
import { dayInTz, timeInTz } from "@/lib/tz";
import { FB_APPROVAL_KEY } from "@/lib/dmLanding";

export const dynamic = "force-dynamic";

// Weekday tasks for team members, and the end-of-day check (Babs, 2026-10-21; see src/lib/teamDailyTasks.ts).
//   7:00 AM Mountain, Mon-Fri: add today's task to the team member's Tasks (once a day).
//   8:00 AM Mountain, Mon-Fri: the team member gets an email at her own address listing ALL her open tasks (overdue,
//   due today, next three days) and the same list as a reminder on her Reminders page (she has no bell: that is
//   Executive Home). Her task reminder emails also still go 60 minutes before a timed task is due (task-reminders cron).
//   8:00 AM and 6:00 PM Mountain, Mon-Fri: if Facebook people are waiting in the pipeline's "fb_approval" stage, a reminder
//   (bell and email) tells Babs how many and who, once per run hour.
//   6:00 PM Mountain, Mon-Fri: if it is not checked complete, put a reminder in front of Babs. The Reminders cron
//   turns that into the bell card and an email, and the notes carry the day's new and follow-up DM counts.
// vercel.json runs this at 13:00, 14:00, 15:00, 00:00 and 01:00 UTC (and on the half hour); only the run that lands on the right Mountain hour
// acts, so daylight saving needs no change. Turn it off: app_settings key "team_daily_tasks" → {"on":false}.
// A day off: app_settings key "team_daily_tasks:skip:YYYY-MM-DD" (any value). Same CRON_SECRET convention.
const APPROVAL_EVENING_HOUR = 18;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
const FROM = process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const { day, weekday, hour } = mountainParts(now);
  if (!isWeekday(weekday)) return NextResponse.json({ skipped: "weekend" });

  const db = createServerClient();
  const { data: sw } = await db.from("app_settings").select("key, value").in("key", ["team_daily_tasks", `team_daily_tasks:skip:${day}`]);
  const setting = new Map(((sw ?? []) as { key: string; value: string }[]).map((s) => [s.key, s.value]));
  if (/"on"\s*:\s*false/.test(setting.get("team_daily_tasks") || "")) return NextResponse.json({ skipped: "turned off" });
  if (setting.has(`team_daily_tasks:skip:${day}`)) return NextResponse.json({ skipped: "day off" });

  const planId = await ownerMasterPlanId(db);
  if (!planId) return NextResponse.json({ skipped: "no owner account" });

  const result: Record<string, string> = {};
  for (const def of TEAM_DAILY_TASKS) {
    const doneKey = `team_daily_tasks:${def.key}:${day}`;
    const alertKey = `team_daily_tasks:${def.key}:alerted:${day}`;
    const { data: marks } = await db.from("app_settings").select("key, value").in("key", [doneKey, alertKey]);
    const mark = new Map(((marks ?? []) as { key: string; value: string }[]).map((m) => [m.key, m.value]));

    // ── 8:00 AM: the member's own task list, by email and as a reminder ────────
    const digestKey = `team_daily_tasks:digest:${def.memberEmail}:${day}`;
    if (hour === DIGEST_HOUR) {
      const { data: dm } = await db.from("app_settings").select("key").eq("key", digestKey).maybeSingle();
      if (!dm) {
        const { data: member } = await db.from("workspace_members").select("id, name, email, user_id, status").ilike("email", def.memberEmail).maybeSingle();
        if (member?.id && member.status !== "inactive" && member.email) {
          const { data: rows } = await db
            .from("tasks")
            .select("id, title, due_at, due_date, due_has_time, today_on")
            .eq("master_plan_id", planId)
            .eq("assignee_member_id", member.id)
            .neq("status", "done")
            .is("completed_at", null)
            .is("archived_at", null)
            .limit(300);
          const list: DigestTask[] = ((rows ?? []) as { id: number; title: string; due_at: string | null; due_date: string | null; due_has_time: boolean | null; today_on: string | null }[]).map((t) => ({
            id: t.id,
            title: t.title,
            day: t.due_at ? dayInTz(t.due_at, TEAM_TZ) : t.due_date ? t.due_date.slice(0, 10) : null,
            time: t.due_at && t.due_has_time ? timeInTz(t.due_at, TEAM_TZ) : null,
            today: t.today_on === day,
          }));
          const g = groupDigest(list, day);
          const first = String(member.name || "").trim().split(/\s+/)[0] || "there";
          const li = (t: DigestTask, showDay: boolean) =>
            `<li style="margin:0 0 9px"><a href="${APP_URL}/tasks?view=mine" style="color:#1a2b4a;font-weight:600;text-decoration:none">${esc(t.title)}</a>${t.time ? ` <span style="color:#7a8a99">· due by ${esc(t.time)} MT</span>` : ""}${showDay && t.day ? ` <span style="color:#7a8a99">· ${esc(niceDay(t.day))}</span>` : ""}</li>`;
          const sec = (title: string, items: DigestTask[], showDay: boolean) =>
            items.length ? `<h2 style="font-size:15px;color:#2E7C83;margin:22px 0 10px;text-transform:uppercase;letter-spacing:1px">${esc(title)} (${items.length})</h2><ul style="padding-left:18px;margin:0">${items.map((t) => li(t, showDay)).join("")}</ul>` : "";
          const total = g.overdue.length + g.dueToday.length + g.soon.length;
          const html = `<div style="font-family:Arial,sans-serif;font-size:14.5px;line-height:1.45;max-width:600px;color:#1a2b4a">
<h1 style="font-size:20px;margin:0 0 4px">Your tasks for today</h1>
<p style="color:#7a8a99;margin:0">${esc(niceDay(day))} · Good morning, ${esc(first)}</p>
${total ? sec("Overdue", g.overdue, true) + sec("Today", g.dueToday, false) + sec("Next three days", g.soon, true) : '<p style="margin:18px 0 0">Nothing is assigned to you today.</p>'}
<p style="margin:24px 0 0"><a href="${APP_URL}/tasks?view=mine" style="display:inline-block;background:#1a2b4a;color:#fff;font-weight:bold;padding:10px 18px;border-radius:999px;text-decoration:none">Open my tasks</a></p>
<p style="color:#7a8a99;font-size:12px;margin:18px 0 0">You get this every weekday at 8:00 AM Mountain. Check each task complete when it is done.</p></div>`;
          const subject = `Your tasks for today: ${g.dueToday.length} due${g.overdue.length ? `, ${g.overdue.length} overdue` : ""}`;
          const resendKey = process.env.RESEND_API_KEY;
          const sent = resendKey
            ? await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from: FROM, to: member.email, subject, html }),
              }).then((r) => r.ok).catch(() => false)
            : false;
          if (member.user_id) {
            const lines = [...g.overdue.map((t) => `Overdue: ${t.title}`), ...g.dueToday.map((t) => `Today: ${t.title}`), ...g.soon.map((t) => `Soon: ${t.title}`)];
            await db.from("reminders").insert({
              master_plan_id: planId,
              title: `Your tasks for today (${niceDay(day)}): ${g.dueToday.length} due${g.overdue.length ? `, ${g.overdue.length} overdue` : ""}`,
              notes: lines.slice(0, 15).join("\n") || "Nothing is assigned to you today.",
              remind_at: now.toISOString(),
              notified_at: now.toISOString(), // the email above is the notice; this is the in-app copy on her Reminders page
              created_by: member.user_id,
            });
          }
          if (sent) await db.from("app_settings").upsert({ key: digestKey, value: "sent", updated_at: now.toISOString() }, { onConflict: "key" });
          result[`${def.key}:digest`] = sent ? "sent" : "email failed";
        }
      }
    }

    // ── Morning: add today's task ─────────────────────────────────────────────
    if (hour === def.createHour && !mark.has(doneKey)) {
      const { data: member } = await db.from("workspace_members").select("id, status").ilike("email", def.memberEmail).maybeSingle();
      if (!member?.id || member.status === "inactive") {
        result[def.key] = "team member not found or inactive";
        continue;
      }
      const dueAt = zonedToUtcISO(day, `${String(def.dueHour).padStart(2, "0")}:00`, TEAM_TZ);
      const { data: task, error } = await db
        .from("tasks")
        .insert({
          master_plan_id: planId,
          title: def.title(niceDay(day), day),
          description: def.description(day),
          status: "today",
          priority: "high",
          owner_action: false,
          assignee_member_id: member.id,
          due_at: dueAt,
          due_has_time: true,
          time_kind: "deadline",
          today_on: day,
        })
        .select("id")
        .single();
      if (error || !task) {
        console.error("team-daily-tasks create:", error?.message);
        result[def.key] = "create failed";
        continue;
      }
      await db.from("app_settings").upsert({ key: doneKey, value: String(task.id), updated_at: now.toISOString() }, { onConflict: "key" });
      result[def.key] = `created ${task.id}`;
      continue;
    }

    // ── Evening: tell Babs if it is still open ────────────────────────────────
    if (hour === def.dueHour && !mark.has(alertKey)) {
      const taskId = Number(mark.get(doneKey));
      const { data: task } = taskId ? await db.from("tasks").select("id, status, completed_at").eq("id", taskId).maybeSingle() : { data: null };
      if (task && (task.status === "done" || task.completed_at)) {
        await db.from("app_settings").upsert({ key: alertKey, value: "complete", updated_at: now.toISOString() }, { onConflict: "key" });
        result[def.key] = "complete";
        continue;
      }
      const sinceISO = zonedToUtcISO(day, "00:00", TEAM_TZ);
      const { data: sends } = await db.from("dm_sends").select("platform, kind").eq("master_plan_id", planId).gte("sent_at", sinceISO).limit(5000);
      const counts = countsLine(tallyDms((sends ?? []) as { platform: string | null; kind: string | null }[]));
      const why = task ? "It is not checked complete." : "Today's task was never added, so nothing was checked.";
      const { error } = await db.from("reminders").insert({
        master_plan_id: planId,
        title: `Sumbal's outreach task is not complete (${niceDay(day)})`,
        notes: `${why} DMs sent today (Mountain time): ${counts} Check in with Sumbal to see why. Tasks: ${APP_URL}/tasks. Pipeline: ${APP_URL}/dm-pipeline`,
        remind_at: now.toISOString(),
      });
      if (error) {
        console.error("team-daily-tasks alert:", error.message);
        result[def.key] = "alert failed";
        continue;
      }
      await db.from("app_settings").upsert({ key: alertKey, value: "alerted", updated_at: now.toISOString() }, { onConflict: "key" });
      result[def.key] = "alerted";
    }
  }
  // ── Facebook people waiting for Babs's approval (the "fb_approval" stage), 8 AM and 6 PM Mountain ──
  if (hour === DIGEST_HOUR || hour === APPROVAL_EVENING_HOUR) {
    const approvalKey = `team_daily_tasks:fb_approval:${day}:${hour}`;
    const { data: sent } = await db.from("app_settings").select("key").eq("key", approvalKey).maybeSingle();
    if (!sent) {
      const { data: stages } = await db.from("dm_stages").select("id, board_id").eq("master_plan_id", planId).eq("key", FB_APPROVAL_KEY);
      const stageIds = ((stages ?? []) as { id: string }[]).map((x) => x.id);
      const { data: waiting } = stageIds.length
        ? await db.from("dm_cards").select("name").eq("master_plan_id", planId).in("stage_id", stageIds).order("created_at").limit(500)
        : { data: [] };
      const names = ((waiting ?? []) as { name: string | null }[]).map((c) => c.name || "Unnamed");
      if (names.length) {
        const { error } = await db.from("reminders").insert({
          master_plan_id: planId,
          title: `${names.length} Facebook ${names.length === 1 ? "person is" : "people are"} waiting for your approval`,
          notes: `Open the first column on the pipeline, remove anyone you do not want messaged, and drag the rest into To reach out. That move is your approval, and Sumbal waits for it. Waiting: ${names.slice(0, 12).join(", ")}${names.length > 12 ? `, and ${names.length - 12} more` : ""}. Pipeline: ${APP_URL}/dm-pipeline`,
          remind_at: now.toISOString(),
        });
        if (error) console.error("team-daily-tasks fb approval:", error.message);
        else {
          await db.from("app_settings").upsert({ key: approvalKey, value: String(names.length), updated_at: now.toISOString() }, { onConflict: "key" });
          result["fb_approval"] = `${names.length} waiting`;
        }
      }
    }
  }
  return NextResponse.json({ day, hour, result });
}

export const GET = run;
export const POST = run;
