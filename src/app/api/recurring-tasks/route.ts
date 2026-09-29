import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { nowParts } from "@/lib/finance/period";
import { isDueOn, scheduleLabel, clockLabel, validateRecurring, type Cadence } from "@/lib/recurring";
import { zonedToUtcISO } from "@/lib/tz";

export const dynamic = "force-dynamic";


type Row = {
  id: string;
  title: string;
  priority: string;
  cadence: Cadence;
  days_of_week: number[] | null;
  day_of_month: number | null;
  time_of_day: string | null;
  time_kind: string;
};

// GET — this client's recurring tasks, with whether each is due today (in the
// viewer's time zone) and whether today's occurrence is already checked off.
export async function GET(request: Request) {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ today: null, tasks: [] });
  const supabase = createServerClient();
  const tz = await resolveUserTimeZone(new URL(request.url).searchParams.get("tz"));
  const { year, month, day } = nowParts(tz);
  const today = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("recurring_tasks")
    .select("id, title, priority, cadence, days_of_week, day_of_month, time_of_day, time_kind")
    .eq("master_plan_id", masterPlanId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("GET /api/recurring-tasks:", error.message);
    return NextResponse.json({ today, tasks: [] });
  }
  const rows = (data ?? []) as Row[];

  const { data: done } = rows.length
    ? await supabase
        .from("recurring_task_completions")
        .select("recurring_task_id")
        .eq("done_on", today)
        .in("recurring_task_id", rows.map((r) => r.id))
    : { data: [] };
  const doneIds = new Set((done ?? []).map((d) => d.recurring_task_id as string));

  return NextResponse.json({
    today,
    tasks: rows.map((r) => ({
      id: r.id,
      title: r.title,
      priority: r.priority,
      cadence: r.cadence,
      daysOfWeek: r.days_of_week ?? [],
      dayOfMonth: r.day_of_month,
      schedule: scheduleLabel(r),
      timeOfDay: r.time_of_day,
      timeLabel: r.time_of_day ? clockLabel(r.time_of_day) : null,
      timeKind: r.time_kind === "scheduled" ? "scheduled" : "deadline",
      // Today's due moment (only for timed tasks), as an instant in the viewer's zone.
      dueAt: r.time_of_day ? zonedToUtcISO(today, r.time_of_day, tz) : null,
      dueToday: isDueOn(r, year, month, day),
      doneToday: doneIds.has(r.id),
    })),
  });
}

// POST — add a recurring task: { title, priority?, cadence, daysOfWeek?, dayOfMonth?,
// timeOfDay? (HH:MM), timeKind? (deadline | scheduled) }.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const v = validateRecurring(body);
  if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });

  const { data, error } = await createServerClient()
    .from("recurring_tasks")
    .insert({
      master_plan_id: masterPlanId,
      ...v.row,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "Couldn't save the task." }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
