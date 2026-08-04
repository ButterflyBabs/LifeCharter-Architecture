import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { ACTIVITY_TYPE_IDS, OUTCOME_IDS, PRIORITIES } from "@/lib/salesActivities";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  type: string;
  contact_name: string | null;
  contact_company: string | null;
  title: string | null;
  priority: string | null;
  status: string | null;
  outcome: string | null;
  estimated_value: number | string | null;
  occurred_on: string | null;
  notes: string | null;
}

function shape(r: Row) {
  return {
    id: r.id,
    type: r.type,
    contactName: r.contact_name || "",
    contactCompany: r.contact_company || "",
    title: r.title || "",
    priority: r.priority || "warm",
    status: r.status || "open",
    outcome: r.outcome || "",
    estimatedValue: Number(r.estimated_value ?? 0),
    occurredOn: r.occurred_on,
    notes: r.notes || "",
  };
}

function startOfWeekUTC(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 Sun..6 Sat
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

// GET — activities + aggregates + weekly goals.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ activities: [], aggregates: null, goals: {} });

  const { data } = await supabase
    .from("sales_activities")
    .select("id, type, contact_name, contact_company, title, priority, status, outcome, estimated_value, occurred_on, notes")
    .eq("master_plan_id", masterPlanId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data || []) as Row[];
  const activities = rows.map(shape);

  const weekStart = startOfWeekUTC();
  const byType: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};
  const thisWeekByType: Record<string, number> = {};
  let pipelineValue = 0;
  let wonValue = 0;
  let wonCount = 0;
  let openCount = 0;
  let completedCount = 0;

  for (const a of activities) {
    byType[a.type] = (byType[a.type] || 0) + 1;
    if (a.outcome) byOutcome[a.outcome] = (byOutcome[a.outcome] || 0) + 1;
    if (a.occurredOn && a.occurredOn >= weekStart) {
      thisWeekByType[a.type] = (thisWeekByType[a.type] || 0) + 1;
    }
    if (a.status === "completed") completedCount += 1;
    else openCount += 1;
    if (a.outcome === "won") {
      wonValue += a.estimatedValue;
      wonCount += 1;
    } else if (a.status !== "completed" || a.outcome === "booked" || a.outcome === "nurture") {
      // Still-live opportunities count toward pipeline.
      if (a.outcome !== "lost") pipelineValue += a.estimatedValue;
    }
  }

  // Weekly goals.
  const { data: goalRows } = await supabase
    .from("sales_goals")
    .select("activity_type, weekly_target")
    .eq("master_plan_id", masterPlanId);
  const goals: Record<string, number> = {};
  for (const g of (goalRows || []) as { activity_type: string; weekly_target: number }[]) {
    goals[g.activity_type] = g.weekly_target;
  }

  const totalContacted = activities.filter((a) => a.outcome && a.outcome !== "no_answer").length;
  const conversionRate = totalContacted > 0 ? Math.round((wonCount / totalContacted) * 100) : 0;

  return NextResponse.json({
    activities,
    aggregates: {
      total: activities.length,
      openCount,
      completedCount,
      byType,
      byOutcome,
      thisWeekByType,
      pipelineValue,
      wonValue,
      wonCount,
      conversionRate,
      weekStart,
    },
    goals,
  });
}

// POST — log a new activity.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  const type = ACTIVITY_TYPE_IDS.includes(body.type) ? body.type : "call";
  const insert = {
    master_plan_id: masterPlanId,
    type,
    contact_name: typeof body.contactName === "string" ? body.contactName.trim() : "",
    contact_company: typeof body.contactCompany === "string" ? body.contactCompany.trim() : "",
    title: typeof body.title === "string" ? body.title.trim() : "",
    priority: PRIORITIES.includes(body.priority) ? body.priority : "warm",
    status: body.status === "completed" ? "completed" : "open",
    outcome: OUTCOME_IDS.includes(body.outcome) ? body.outcome : "",
    estimated_value: Number.isFinite(Number(body.estimatedValue)) ? Number(body.estimatedValue) : 0,
    occurred_on:
      typeof body.occurredOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.occurredOn)
        ? body.occurredOn
        : new Date().toISOString().slice(0, 10),
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
  };

  const { data, error } = await supabase
    .from("sales_activities")
    .insert(insert)
    .select("id, type, contact_name, contact_company, title, priority, status, outcome, estimated_value, occurred_on, notes")
    .single();
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ activity: shape(data as Row) });
}

// PATCH — edit an activity, toggle complete, set outcome, or set a weekly goal.
export async function PATCH(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No workspace." }, { status: 400 });
  const body = await request.json().catch(() => ({}));

  // Set a weekly goal.
  if (body.action === "goal") {
    const t = ACTIVITY_TYPE_IDS.includes(body.activityType) ? body.activityType : "";
    if (!t) return NextResponse.json({ error: "Unknown type." }, { status: 400 });
    const target = Math.max(0, Math.round(Number(body.weeklyTarget) || 0));
    const { data: existing } = await supabase
      .from("sales_goals")
      .select("id")
      .eq("master_plan_id", masterPlanId)
      .eq("activity_type", t)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("sales_goals").update({ weekly_target: target, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("sales_goals").insert({ master_plan_id: masterPlanId, activity_type: t, weekly_target: target });
    }
    return NextResponse.json({ ok: true });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.action === "toggle") {
    const { data: cur } = await supabase
      .from("sales_activities")
      .select("status")
      .eq("id", id)
      .eq("master_plan_id", masterPlanId)
      .maybeSingle();
    update.status = cur?.status === "completed" ? "open" : "completed";
  } else {
    if (typeof body.title === "string") update.title = body.title.trim();
    if (typeof body.contactName === "string") update.contact_name = body.contactName.trim();
    if (typeof body.contactCompany === "string") update.contact_company = body.contactCompany.trim();
    if (ACTIVITY_TYPE_IDS.includes(body.type)) update.type = body.type;
    if (PRIORITIES.includes(body.priority)) update.priority = body.priority;
    if (body.status === "open" || body.status === "completed") update.status = body.status;
    if (OUTCOME_IDS.includes(body.outcome)) update.outcome = body.outcome;
    if (body.estimatedValue !== undefined && Number.isFinite(Number(body.estimatedValue)))
      update.estimated_value = Number(body.estimatedValue);
    if (typeof body.occurredOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.occurredOn))
      update.occurred_on = body.occurredOn;
    if (typeof body.notes === "string") update.notes = body.notes.trim();
  }

  const { error } = await supabase
    .from("sales_activities")
    .update(update)
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);
  if (error) return NextResponse.json({ error: "Couldn't save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove an activity (?id=...).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await supabase
    .from("sales_activities")
    .delete()
    .eq("id", id)
    .eq("master_plan_id", masterPlanId);
  if (error) return NextResponse.json({ error: "Couldn't delete." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
