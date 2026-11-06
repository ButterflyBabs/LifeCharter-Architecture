import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ownerMasterPlanId } from "@/lib/housePlan";
import { zonedToUtcISO } from "@/lib/tz";
import { TEAM_TZ, mountainParts, niceDay } from "@/lib/teamDailyTasks";
import { goalProgress, mondayOfDay, shiftMinutes } from "@/lib/workLog";
import { hm } from "@/lib/timeTracking";

export const dynamic = "force-dynamic";

// Friday check on weekly hours goals (Babs, 2026-11-06). Fridays at 2:00 PM Mountain, if anyone with a Work Log weekly
// hours goal is short for the Monday-to-Sunday week so far, a reminder goes to the account owner ONLY (bell and email via the
// Reminders cron); the team member gets nothing. Nothing is sent when everyone has reached their goal. Hours are time on the
// clock (open shifts count up to now), approved or not. One check per Friday (app_settings key work_log_goals:<day>).
// vercel.json runs this at 20:00 and 21:00 UTC; only the run that lands on 2 PM Mountain acts, so daylight saving needs no change.
// Turn it off: app_settings key "work_log_goals" -> {"on":false}. Same CRON_SECRET convention.
const CHECK_HOUR = 14;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = new Date();
  const { day, weekday, hour } = mountainParts(now);
  if (weekday !== 5 || hour !== CHECK_HOUR) return NextResponse.json({ skipped: "not Friday 2 PM Mountain" });

  const db = createServerClient();
  const key = `work_log_goals:${day}`;
  const { data: sw } = await db.from("app_settings").select("key, value").in("key", ["work_log_goals", key]);
  const setting = new Map(((sw ?? []) as { key: string; value: string }[]).map((s) => [s.key, s.value]));
  if (/"on"\s*:\s*false/.test(setting.get("work_log_goals") || "")) return NextResponse.json({ skipped: "turned off" });
  if (setting.has(key)) return NextResponse.json({ skipped: "already checked today" });

  const planId = await ownerMasterPlanId(db);
  if (!planId) return NextResponse.json({ skipped: "no owner account" });
  const { data: goals } = await db.from("work_log_goals").select("person_email, weekly_hours").eq("master_plan_id", planId);
  const list = (goals ?? []) as { person_email: string; weekly_hours: number | string }[];
  if (!list.length) return NextResponse.json({ skipped: "no goals set" });

  const from = zonedToUtcISO(mondayOfDay(day, weekday), "00:00", TEAM_TZ);
  const { data: shifts } = await db.from("work_shifts").select("person_email, person_name, clock_in, clock_out").eq("master_plan_id", planId).gte("clock_in", from).lte("clock_in", now.toISOString()).limit(2000);
  const rows = (shifts ?? []) as { person_email: string; person_name: string | null; clock_in: string; clock_out: string | null }[];

  const short: string[] = [];
  for (const g of list) {
    const mine = rows.filter((r) => r.person_email.toLowerCase() === g.person_email.toLowerCase());
    const mins = mine.reduce((n, r) => n + shiftMinutes(r, now.getTime()), 0);
    const prog = goalProgress(mins, g.weekly_hours);
    if (!prog || prog.shortMin <= 0) continue;
    const name = mine.find((r) => r.person_name)?.person_name || g.person_email.split("@")[0];
    short.push(`${name}: ${hm(mins)} of ${hm(prog.goalMin)}, ${hm(prog.shortMin)} short`);
  }

  if (short.length) {
    const { error } = await db.from("reminders").insert({
      master_plan_id: planId,
      title: `Short on hours this week (${niceDay(day)}): ${short.length === 1 ? short[0].split(":")[0] : `${short.length} people`}`,
      notes: `Weekly hours so far (Monday to now, time on the clock). ${short.join(". ")}. Work Log: ${APP_URL}/work-log`,
      remind_at: now.toISOString(),
    });
    if (error) {
      console.error("work-log-goals reminder:", error.message);
      return NextResponse.json({ error: "reminder failed" }, { status: 500 });
    }
  }
  await db.from("app_settings").upsert({ key, value: short.length ? `short:${short.length}` : "all on track", updated_at: now.toISOString() }, { onConflict: "key" });
  return NextResponse.json({ checked: list.length, short: short.length });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
