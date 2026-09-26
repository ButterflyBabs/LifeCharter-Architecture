import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Set (or clear, with 0) the weekly or yearly income goal for this client.
// The monthly goal is set through /api/finance/budgets (income, category "").
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const period = body.period === "week" || body.period === "year" ? body.period : null;
  const amount = Number(body.amount);
  if (!period) return NextResponse.json({ error: "period must be week or year" }, { status: 400 });
  if (!isFinite(amount) || amount < 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });

  const supabase = createServerClient();
  if (amount === 0) {
    await supabase.from("finance_goals").delete().eq("master_plan_id", masterPlanId).eq("period", period);
    return NextResponse.json({ cleared: true });
  }
  const { error } = await supabase
    .from("finance_goals")
    .upsert(
      { master_plan_id: masterPlanId, period, amount, updated_at: new Date().toISOString() },
      { onConflict: "master_plan_id,period" }
    );
  if (error) return NextResponse.json({ error: "Couldn't save the goal." }, { status: 500 });
  return NextResponse.json({ ok: true, period, amount });
}
