import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { PlanType } from "@/lib/plans/generatePlan";

export const dynamic = "force-dynamic";

const VALID: PlanType[] = ["business", "marketing", "sales"];

// Returns the current active plan (+ its goals) for a plan type, or
// { hasPlan: false } when none has been generated yet. Per-client via
// master_plan_id.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as PlanType | null;
  if (!type || !VALID.includes(type)) {
    return NextResponse.json({ error: "type must be business, marketing, or sales" }, { status: 400 });
  }

  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();
  const { data: plan } = await supabase
    .from("client_plans")
    .select("id, plan_type, version, status, generated_by, title, summary, source_snapshot, created_at, updated_at")
    .eq("master_plan_id", planId)
    .eq("plan_type", type)
    .eq("status", "active")
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ hasPlan: false, type }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: goals } = await supabase
    .from("client_plan_goals")
    .select("id, dimension_key, title, detail, target, status, sort_order, added_at")
    .eq("plan_id", plan.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json(
    { hasPlan: true, plan, goals: goals ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
