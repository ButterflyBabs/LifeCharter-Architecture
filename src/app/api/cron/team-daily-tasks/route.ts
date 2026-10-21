import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { zonedToUtcISO } from "@/lib/tz";
import { TEAM_DAILY_TASKS, TEAM_TZ, countsLine, isWeekday, mountainParts, niceDay, tallyDms } from "@/lib/teamDailyTasks";

export const dynamic = "force-dynamic";

// Weekday tasks for team members, and the end-of-day check (Babs, 2026-10-21; see src/lib/teamDailyTasks.ts).
//   7:00 AM Mountain, Mon-Fri: add today's task to the team member's Tasks (once a day).
//   6:00 PM Mountain, Mon-Fri: if it is not checked complete, put a reminder in front of Babs. The Reminders cron
//   turns that into the bell card and an email, and the notes carry the day's new and follow-up DM counts.
// vercel.json runs this at 13:00, 14:00, 00:00 and 01:00 UTC; only the run that lands on the right Mountain hour
// acts, so daylight saving needs no change. Turn it off: app_settings key "team_daily_tasks" → {"on":false}.
// A day off: app_settings key "team_daily_tasks:skip:YYYY-MM-DD" (any value). Same CRON_SECRET convention.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

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
          title: def.title(niceDay(day)),
          description: def.description,
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
  return NextResponse.json({ day, hour, result });
}

export const GET = run;
export const POST = run;
