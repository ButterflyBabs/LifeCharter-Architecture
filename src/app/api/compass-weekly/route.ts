import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { dayInTz, zonedToUtcISO } from "@/lib/tz";
import { publishedPostCounts } from "@/lib/social/postCounts";
import { ACTIVITY_TYPES } from "@/lib/salesActivities";

export const dynamic = "force-dynamic";

// Weekly View for the Daily Compass: one week (Monday–Sunday, in the client's
// time zone) of the client's REAL activity, their weekly goals, and their
// streak. Everything is scoped to their own plan.
//
// A day counts as "active" when the client did at least one thing that day:
// completed a task, checked off a recurring task, logged a call or follow-up
// in Sales Activities (or completed a follow-up task), or posted.

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  return ymd(new Date(Date.UTC(y, m - 1, d + n)));
};
const mondayOf = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(day, -((dow + 6) % 7));
};
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayCounts {
  tasks: number;
  recurring: number;
  calls: number;
  followups: number;
  posts: number;
  other: number; // other sales outreach (emails, DMs, meetings, demos, proposals)
  sales: Record<string, number>; // Sales Activities entries by type (for the goals)
}
const empty = (): DayCounts => ({ tasks: 0, recurring: 0, calls: 0, followups: 0, posts: 0, other: 0, sales: {} });

// Goal rows: the label and unit for each Sales Activities type.
const GOAL_META: Record<string, { category: string; unit: string }> = {
  call: { category: "Sales Calls", unit: "calls" },
  followup: { category: "Follow-ups", unit: "follow-ups" },
  email: { category: "Emails", unit: "emails" },
  dm: { category: "DMs", unit: "DMs" },
  meeting: { category: "Meetings", unit: "meetings" },
  demo: { category: "Demos", unit: "demos" },
  proposal: { category: "Proposals Sent", unit: "proposals" },
};

export async function GET(request: Request) {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const tz = await resolveUserTimeZone(url.searchParams.get("tz"));
  const supabase = createServerClient();

  const today = dayInTz(new Date(), tz);
  const currentWeekStart = mondayOf(today);
  const requested = url.searchParams.get("week") || "";
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(requested) ? mondayOf(requested) : currentWeekStart;

  // Everything we count, for the last ~year (streaks) — grouped by local day.
  const sinceDay = addDays(today, -365);
  const sinceISO = zonedToUtcISO(sinceDay, "00:00", tz);
  const days = new Map<string, DayCounts>();
  const at = (day: string) => {
    let c = days.get(day);
    if (!c) days.set(day, (c = empty()));
    return c;
  };

  const [{ data: tasks }, { data: rec }, { data: sales }, { data: goalRows }, postCounts] = await Promise.all([
    supabase.from("tasks").select("completed_at, followup").eq("master_plan_id", masterPlanId).eq("status", "done").gte("completed_at", sinceISO).limit(5000),
    supabase.from("recurring_tasks").select("id").eq("master_plan_id", masterPlanId),
    supabase.from("sales_activities").select("type, occurred_on").eq("master_plan_id", masterPlanId).gte("occurred_on", sinceDay).limit(5000),
    supabase.from("sales_goals").select("activity_type, weekly_target").eq("master_plan_id", masterPlanId),
    publishedPostCounts(masterPlanId, tz, sinceDay),
  ]);

  for (const t of (tasks ?? []) as { completed_at: string; followup: { channel?: string } | null }[]) {
    const c = at(dayInTz(t.completed_at, tz));
    c.tasks += 1;
    if (t.followup?.channel) c.followups += 1; // a completed follow-up task is a follow-up done
  }
  const recIds = ((rec ?? []) as { id: string }[]).map((r) => r.id);
  if (recIds.length) {
    const { data: done } = await supabase.from("recurring_task_completions").select("done_on").in("recurring_task_id", recIds).gte("done_on", sinceDay).limit(5000);
    for (const d of (done ?? []) as { done_on: string }[]) at(String(d.done_on).slice(0, 10)).recurring += 1;
  }
  // Sales Activities count on the day they happened — never before it.
  for (const s of (sales ?? []) as { type: string; occurred_on: string }[]) {
    const day = String(s.occurred_on).slice(0, 10);
    if (day > today) continue;
    const c = at(day);
    c.sales[s.type] = (c.sales[s.type] ?? 0) + 1;
    if (s.type === "call") c.calls += 1;
    else if (s.type === "followup") c.followups += 1;
    else c.other += 1;
  }
  // Posts published — Social Planner posts plus posts made only in PostStream.
  postCounts.byDay.forEach((n, day) => {
    at(day).posts += n;
  });

  const activeCount = (c?: DayCounts) => (c ? c.tasks + c.recurring + c.calls + c.followups + c.posts + c.other : 0);
  const isActive = (day: string) => activeCount(days.get(day)) > 0;

  // The requested week.
  const week = DAY_NAMES.map((dayName, i) => {
    const date = addDays(weekStart, i);
    const c = days.get(date) ?? empty();
    return {
      date,
      dayName,
      isToday: date === today,
      isFuture: date > today,
      active: activeCount(c) > 0,
      calls: c.calls,
      posts: c.posts,
      followups: c.followups,
      tasksDone: c.tasks + c.recurring,
    };
  });
  const sum = (k: "calls" | "posts" | "followups" | "tasksDone") => week.reduce((t, d) => t + d[k], 0);
  // This week's Sales Activities entries by type (DMs, emails, meetings, proposals…).
  const salesThisWeek = (type: string) => Array.from({ length: 7 }, (_, i) => days.get(addDays(weekStart, i))?.sales[type] ?? 0).reduce((a, b) => a + b, 0);

  const targets: Record<string, number> = {};
  for (const g of (goalRows ?? []) as { activity_type: string; weekly_target: number }[]) targets[g.activity_type] = g.weekly_target;
  // Calls, follow-ups and proposals always show; any other activity type shows
  // once the client has set a weekly goal for it (so a DM goal appears here too).
  const goals = ACTIVITY_TYPES.filter((t) => ["call", "followup", "proposal"].includes(t.id) || targets[t.id] != null).map((t) => ({
    id: t.id,
    category: GOAL_META[t.id]?.category ?? t.label,
    target: targets[t.id] ?? null,
    // Calls and follow-ups also include what's logged elsewhere (completed follow-up tasks).
    current: t.id === "call" ? sum("calls") : t.id === "followup" ? sum("followups") : salesThisWeek(t.id),
    unit: GOAL_META[t.id]?.unit ?? "",
  }));

  // Streaks: consecutive active days ending today (or yesterday, so a quiet
  // morning doesn't zero it), and the longest run in the last year.
  let current = 0;
  let cursor = isActive(today) ? today : addDays(today, -1);
  while (cursor >= sinceDay && isActive(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  for (let d = sinceDay; d <= today; d = addDays(d, 1)) {
    run = isActive(d) ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  return NextResponse.json({
    weekStart,
    weekEnd: addDays(weekStart, 6),
    isCurrentWeek: weekStart === currentWeekStart,
    today,
    days: week,
    goals,
    totals: { calls: sum("calls"), posts: sum("posts"), followups: sum("followups"), tasksDone: sum("tasksDone"), daysActive: week.filter((d) => d.active).length },
    streak: { current, longest },
  });
}
