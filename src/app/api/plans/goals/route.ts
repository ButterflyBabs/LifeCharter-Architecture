import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { getOrCreatePrimaryMasterPlan } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Update a plan goal's status. This is the client marking their own progress
// (not a coach override), so it isn't super-admin gated — but the goal must
// belong to this client's master plan. Feeds the progress execution axis.

const STATUSES = ["not_started", "in_progress", "met", "slipped"] as const;
type GoalStatus = (typeof STATUSES)[number];

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const goalId = body?.goalId as string | undefined;
  const status = body?.status as GoalStatus | undefined;
  if (!goalId || !status || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "goalId and a valid status are required" }, { status: 400 });
  }

  const planId = await getOrCreatePrimaryMasterPlan();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();

  // Confirm the goal belongs to a plan under this client's master plan.
  const { data: goal } = await supabase
    .from("client_plan_goals")
    .select("id, plan_id")
    .eq("id", goalId)
    .maybeSingle();
  if (!goal) return NextResponse.json({ error: "goal not found" }, { status: 404 });
  const { data: parent } = await supabase
    .from("client_plans")
    .select("master_plan_id")
    .eq("id", (goal as { plan_id: string }).plan_id)
    .maybeSingle();
  if (!parent || (parent as { master_plan_id: string }).master_plan_id !== planId) {
    return NextResponse.json({ error: "goal not found" }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("client_plan_goals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .select("id, dimension_key, title, detail, target, status, sort_order")
    .single();

  if (error || !updated) {
    console.error("goal status update:", error?.message);
    return NextResponse.json({ error: "failed to update goal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, goal: updated }, { headers: { "Cache-Control": "no-store" } });
}
