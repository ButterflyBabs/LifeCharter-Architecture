import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { replyNotifyList, sendWeeklyStops } from "@/lib/coldEmailReplies";
import { isHousePlan } from "@/lib/housePlan";
import { mountainParts } from "@/lib/teamDailyTasks";

export const dynamic = "force-dynamic";

// The weekly cold email stop report. Fridays, 4:00 PM Mountain: one email per account that sends cold email, listing everyone
// who answered "no thanks" or asked to stop in the past seven days (an empty week says so). Goes to the same people as the
// reply alerts (metadata.coldReplyNotify). vercel.json runs it at 22:00 and 23:00 UTC; only the run that lands on 4 PM Mountain
// acts, so daylight saving needs no change. Same CRON_SECRET convention as the other crons.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = new Date();
  const { weekday, hour, day } = mountainParts(now);
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (!force && !(weekday === 5 && hour === 16)) return NextResponse.json({ skipped: "not Friday 4 PM Mountain" });

  const db = createServerClient();
  const { data: all } = await db.from("cold_email_settings").select("master_plan_id, board_id, tz").eq("enabled", true);
  const result: Record<string, string> = {};
  for (const s of (all ?? []) as { master_plan_id: string; board_id: string | null; tz: string | null }[]) {
    const key = `cold-email-weekly:${s.master_plan_id}:${day}`;
    const { data: done } = await db.from("app_settings").select("key").eq("key", key).maybeSingle();
    if (done && !force) { result[s.master_plan_id] = "already sent"; continue; }
    const { data: meta } = await db.from("client_master_plans").select("metadata, client_email").eq("id", s.master_plan_id).maybeSingle();
    const to = replyNotifyList(meta?.metadata, await isHousePlan(s.master_plan_id, db), (meta?.client_email as string | null) ?? "");
    const { data: board } = s.board_id ? await db.from("pipeline_boards").select("name").eq("id", s.board_id).maybeSingle() : { data: null };
    const n = await sendWeeklyStops(db, s.master_plan_id, (board?.name as string) || "Cold Email", to, s.tz || "America/Denver", now);
    if (n < 0) { result[s.master_plan_id] = "could not send"; continue; }
    await db.from("app_settings").upsert({ key, value: String(n), updated_at: now.toISOString() }, { onConflict: "key" });
    result[s.master_plan_id] = `sent (${n})`;
  }
  return NextResponse.json({ day, result });
}
