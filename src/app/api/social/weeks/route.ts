import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { socialContext, isYmd, str } from "@/lib/social/server";
import { mondayOf, type WeekDoc } from "@/lib/social/planner";

export const dynamic = "force-dynamic";

interface WeekRow {
  week_start: string;
  actuals: WeekDoc["actuals"] | null;
  habits: WeekDoc["habits"] | null;
  notes: string | null;
}

const shape = (r: WeekRow): WeekDoc => ({
  weekStart: r.week_start,
  actuals: r.actuals || {},
  habits: r.habits || {},
  notes: r.notes || "",
});

const key = (s: unknown) => (typeof s === "string" && /^[a-z0-9_-]{1,40}$/i.test(s) ? s : "");

// GET — week docs (actuals, habit check-offs, notes), optionally ?from=&to= (Mondays).
export async function GET(request: Request) {
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const url = new URL(request.url);
  let q = ctx.supabase.from("social_weeks").select("week_start, actuals, habits, notes").eq("master_plan_id", ctx.masterPlanId);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (isYmd(from)) q = q.gte("week_start", from);
  if (isYmd(to)) q = q.lte("week_start", to);
  const { data, error } = await q.order("week_start");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ weeks: ((data || []) as WeekRow[]).map(shape) });
}

// PATCH — one change to one week:
//   { habit: { platform, metric, date, on } }      tick / untick a habit day
//   { actual: { weekStart, platform, metric, value } }   a number from analytics
//   { notes: { weekStart, text } }                 "what worked this week"
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const ctx = await socialContext();
  if (!ctx.ok) return ctx.res;
  const body = await request.json().catch(() => ({}));

  const weekStart = isYmd(body.habit?.date) ? mondayOf(body.habit.date) : isYmd(body.actual?.weekStart) ? mondayOf(body.actual.weekStart) : isYmd(body.notes?.weekStart) ? mondayOf(body.notes.weekStart) : "";
  if (!weekStart) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });

  const { data: existing } = await ctx.supabase
    .from("social_weeks")
    .select("week_start, actuals, habits, notes")
    .eq("master_plan_id", ctx.masterPlanId)
    .eq("week_start", weekStart)
    .maybeSingle();
  const week = existing ? shape(existing as WeekRow) : { weekStart, actuals: {}, habits: {}, notes: "" };

  if (body.habit) {
    const k = `${key(body.habit.platform)}.${key(body.habit.metric)}`;
    if (k === ".") return NextResponse.json({ error: "Bad habit." }, { status: 400 });
    const days = { ...(week.habits[k] || {}) };
    if (body.habit.on) days[body.habit.date] = true;
    else delete days[body.habit.date];
    week.habits = { ...week.habits, [k]: days };
  } else if (body.actual) {
    const pid = key(body.actual.platform);
    const mid = key(body.actual.metric);
    if (!pid || !mid) return NextResponse.json({ error: "Bad metric." }, { status: 400 });
    const raw = body.actual.value;
    const v = raw === null || raw === "" ? null : Number(raw);
    const row = { ...(week.actuals[pid] || {}) };
    if (v === null || !Number.isFinite(v)) delete row[mid];
    else row[mid] = v;
    week.actuals = { ...week.actuals, [pid]: row };
  } else if (body.notes) {
    week.notes = str(body.notes.text, 10000);
  }

  const { error } = await ctx.supabase.from("social_weeks").upsert(
    {
      master_plan_id: ctx.masterPlanId,
      week_start: weekStart,
      actuals: week.actuals,
      habits: week.habits,
      notes: week.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "master_plan_id,week_start" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ week });
}
