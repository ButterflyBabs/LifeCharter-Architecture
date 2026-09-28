import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planBusinessIds, planSegmentIds } from "@/lib/planScope";
import { dueFromBody } from "@/lib/taskDueInput";
import { currentBusiness } from "@/lib/businessScope";
import { planMembers, myMemberId, notifyAssignee, actorName } from "@/lib/taskAssignees";

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
      "id, title, description, status, priority, energy, due_date, due_at, due_has_time, time_kind, followup, completed_at, segment_id, assignee_member_id, business:businesses(name, color), segment:segments(name, color)"
    )
    .eq("master_plan_id", masterPlanId);
  if (scope) q = q.eq("business_id", scope.businessId);
  // ?assignee=me (the signed-in member's; the owner's = unassigned) | none | <member id>
  const who = new URL(request.url).searchParams.get("assignee");
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
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

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
  return NextResponse.json({ task: data, persisted: true });
}
