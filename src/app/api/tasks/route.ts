import { NextResponse } from "next/server";
import { todayOnFrom } from "@/lib/taskToday";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planBusinessIds, planSegmentIds } from "@/lib/planScope";
import { dueFromBody } from "@/lib/taskDueInput";
import { currentBusiness } from "@/lib/businessScope";
import { salesMemberId, planMembers, myMemberId, notifyAssignee, actorName } from "@/lib/taskAssignees";
import { logActivity, q } from "@/lib/activity";

// Always query live data per request.
export const dynamic = "force-dynamic";

// Tasks API for the Executive Home Priority Tasks card.
// Backed by the `tasks` table introduced in the multi_business_model migration.

const DIMENSION_COLUMNS: Record<string, string> = {
  marketing: "dimension_marketing",
  sales: "dimension_sales",
  operations: "dimension_operations",
  finance: "dimension_finance",
  team: "dimension_team",
  systems: "dimension_systems",
  leadership: "dimension_leadership",
  vision: "dimension_vision",
  product: "dimension_product",
  customer_experience: "dimension_customer_experience",
  legal: "dimension_legal",
  sustainability: "dimension_sustainability",
};

export async function GET(request: Request) {
  const supabase = createServerClient();
  // Each client sees only their own plan's tasks.
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ tasks: [] });
  // Header business switcher: only that business's tasks.
  const scope = await currentBusiness(masterPlanId);
  let q = supabase
    .from("tasks")
    .select(
      "id, title, description, status, priority, energy, due_date, due_at, due_has_time, time_kind, followup, completed_at, created_at, today_on, segment_id, assignee_member_id, business:businesses(name, color), segment:segments(name, color)"
    )
    .eq("master_plan_id", masterPlanId);
  if (scope) q = q.eq("business_id", scope.businessId);
  // ?assignee=me (the signed-in member's; the owner's = unassigned) | none | <member id>
  const params = new URL(request.url).searchParams;
  // A Sales member sees only the tasks assigned to them, whatever the address asks for.
  const salesId = await salesMemberId();
  const who = salesId ? "me" : params.get("assignee");
  // ?archived=1 lists archived (done) tasks; the board never includes them.
  const wantArchived = params.get("archived") === "1";
  q = wantArchived ? q.not("archived_at", "is", null) : q.is("archived_at", null);
  if (who === "me") {
    const me = await myMemberId();
    q = me ? q.eq("assignee_member_id", me) : q.is("assignee_member_id", null);
  } else if (who === "none") q = q.is("assignee_member_id", null);
  else if (who && /^[0-9a-f-]{36}$/i.test(who)) q = q.eq("assignee_member_id", who);
  const { data, error } = await q
    .order("board_position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET /api/tasks:", error.message);
    return NextResponse.json({ tasks: [], error: error.message }, { status: 200 });
  }
  // How many are archived (same scope and assignee filter), so the page can offer "Archived (N)".
  let cq = supabase.from("tasks").select("id", { count: "exact", head: true }).eq("master_plan_id", masterPlanId).not("archived_at", "is", null);
  if (scope) cq = cq.eq("business_id", scope.businessId);
  if (who === "me") {
    const me = await myMemberId();
    cq = me ? cq.eq("assignee_member_id", me) : cq.is("assignee_member_id", null);
  } else if (who === "none") cq = cq.is("assignee_member_id", null);
  else if (who && /^[0-9a-f-]{36}$/i.test(who)) cq = cq.eq("assignee_member_id", who);
  const { count: archivedCount } = await cq;
  return NextResponse.json({ tasks: data ?? [], archivedCount: archivedCount ?? 0 });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  // A Sales member can only add tasks for themselves.
  const salesId = await salesMemberId();
  if (salesId) body.assigneeId = salesId;

  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // A task can only be linked to the client's own business / segment.
  let businessId = body.businessId && (await planBusinessIds(masterPlanId)).includes(Number(body.businessId)) ? body.businessId : null;
  const segmentId = body.segmentId && (await planSegmentIds(masterPlanId)).includes(Number(body.segmentId)) ? body.segmentId : null;
  if (segmentId && !businessId) {
    const { data: seg } = await supabase.from("segments").select("business_id").eq("id", segmentId).maybeSingle();
    businessId = seg?.business_id ?? null;
  }
  // Created while one business is chosen in the header: it belongs to that business.
  if (!businessId && !segmentId) businessId = (await currentBusiness(masterPlanId))?.businessId ?? null;

  const row: Record<string, unknown> = {
    master_plan_id: masterPlanId,
    title: body.title,
    description: body.description ?? null,
    status: body.status ?? "today",
    priority: body.priority ?? "medium",
    energy: ["low", "medium", "high"].includes(body.energy) ? body.energy : "medium",
    business_id: businessId,
    segment_id: segmentId,
    due_date: body.dueDate ?? null,
    due_at: body.dueAt ?? null,
    // The day it was put on Today by hand (the page sends its own local date; otherwise the account's own zone).
    today_on: (body.status ?? "today") === "today" ? await todayOnFrom(body.todayOn) : null,
    followup: body.followup && typeof body.followup === "object" ? body.followup : {},
  };
  // A due date/time: either the structured fields (day + optional time, read in
  // the user's zone) or a ready-made ISO instant (follow-ups, tax deadlines).
  const due = await dueFromBody(body);
  if (due === "invalid") return NextResponse.json({ error: "Enter a valid due date." }, { status: 400 });
  if (due) Object.assign(row, due);
  else if (body.dueAt) row.due_has_time = true;
  for (const key of Array.isArray(body.dimensions) ? body.dimensions : []) {
    const col = DIMENSION_COLUMNS[key];
    if (col) row[col] = true;
  }

  // Assigned to a team member of this account (checked), or left as the owner's.
  let assignee = null as Awaited<ReturnType<typeof planMembers>>[number] | null;
  if (typeof body.assigneeId === "string" && body.assigneeId) {
    assignee = (await planMembers(masterPlanId)).find((m) => m.id === body.assigneeId) ?? null;
    if (!assignee) return NextResponse.json({ error: "That person isn't on this account's team." }, { status: 400 });
    row.assignee_member_id = assignee.id;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert(row)
    .select(
      "id, title, status, priority, due_at, due_has_time, time_kind, business:businesses(name, color), segment:segments(name, color)"
    )
    .single();

  if (error) {
    console.error("POST /api/tasks:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (assignee && assignee.id !== (await myMemberId())) {
    await notifyAssignee(assignee, { title: String(body.title), due_at: (row.due_at as string) ?? null }, await actorName()).catch(() => {});
  }
  await logActivity({
    masterPlanId,
    action: "created",
    entityType: "task",
    entityId: data?.id as number | undefined,
    summary: `Added task ${q(body.title)}${assignee ? ` for ${assignee.name}` : ""}`,
  });
  return NextResponse.json({ task: data, persisted: true });
}
