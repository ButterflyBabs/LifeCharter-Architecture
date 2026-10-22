import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { loadReport, snapshot } from "@/lib/metaAdsServer";
import { mountainParts } from "@/lib/teamDailyTasks";

export const dynamic = "force-dynamic";

// The weekly Meta Ads report. Mondays, 8:00 AM Mountain: for every account that has uploaded Ads Manager figures, save the
// week's report and put one reminder in front of the owner (the bell card and email come from the reminders cron): either
// "your report is ready" with the headline, or "upload this week's export" when the newest figures are more than 6 days old.
// vercel.json runs it at 14:00 and 15:00 UTC; only the run that lands on 8 AM Mountain acts, so daylight saving needs no change.
// Same CRON_SECRET convention as the other crons.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = new Date();
  const { weekday, hour, day } = mountainParts(now);
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (!force && !(weekday === 1 && hour === 8)) return NextResponse.json({ skipped: "not Monday 8 AM Mountain" });

  const db = createServerClient();
  const { data: plans } = await db.from("meta_ad_stats").select("master_plan_id").limit(5000);
  const ids = Array.from(new Set(((plans ?? []) as { master_plan_id: string }[]).map((p) => p.master_plan_id)));
  const result: Record<string, string> = {};
  for (const planId of ids) {
    const key = `meta-ads-report:${planId}:${day}`;
    const { data: done } = await db.from("app_settings").select("key").eq("key", key).maybeSingle();
    if (done && !force) { result[planId] = "already done"; continue; }
    const b = (await snapshot(db, planId)) ?? (await loadReport(db, planId));
    if (!b) { result[planId] = "no data"; continue; }
    const r = b.report;
    const stale = b.ageDays > 6;
    const act = r.ads.filter((x) => x.verdict === "pause" || x.verdict === "stop").length;
    const title = stale ? "Upload this week's Meta Ads export" : "Your weekly Meta Ads report is ready";
    const notes = stale
      ? `Your newest Meta Ads figures end ${r.periodEnd}. In Ads Manager choose the Ads tab and last 7 days, export the table as a CSV, and add it under Meta Lead Ads > Weekly report: ${APP_URL}/meta-leads`
      : `${r.totals.leads} lead${r.totals.leads === 1 ? "" : "s"} for $${r.totals.spend.toFixed(2)}${r.totals.cpl ? ` ($${r.totals.cpl.toFixed(2)} each)` : ""}. ${r.campaign.headline}.${act ? ` ${act} ad${act === 1 ? "" : "s"} to pause or stop.` : ""} Open it: ${APP_URL}/meta-leads`;
    const { data: open } = await db.from("reminders").select("id").eq("master_plan_id", planId).eq("status", "open").eq("title", title).limit(1);
    if (!open?.length) await db.from("reminders").insert({ master_plan_id: planId, title, notes, remind_at: now.toISOString(), status: "open" });
    await db.from("app_settings").upsert({ key, value: stale ? "stale" : "ready", updated_at: now.toISOString() }, { onConflict: "key" });
    result[planId] = stale ? "asked for export" : "report ready";
  }
  return NextResponse.json({ day, result });
}
