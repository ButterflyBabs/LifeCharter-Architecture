import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { buildForecast } from "@/lib/planning/forecastData";

export const dynamic = "force-dynamic";

// Rollup for the Strategic Planning Hub cards. Plans come from client_plans,
// money from finance_entries, pipeline from sales_activities, and the forecast
// summary from the forecast engine.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ connected: false });

  // --- Plans (business / marketing / sales) ---
  const { data: planRows } = await supabase
    .from("client_plans")
    .select("id, plan_type, status, title, updated_at")
    .eq("master_plan_id", masterPlanId)
    .eq("status", "active");
  const plansByType = new Map(
    ((planRows || []) as { id: string; plan_type: string; status: string; title: string | null; updated_at: string | null }[]).map(
      (p) => [p.plan_type, p]
    )
  );

  // Goal completeness per plan.
  const planIds = Array.from(plansByType.values()).map((p) => p.id);
  const goalCounts = new Map<string, { total: number; done: number }>();
  if (planIds.length) {
    const { data: goals } = await supabase
      .from("client_plan_goals")
      .select("plan_id, status")
      .in("plan_id", planIds);
    for (const g of (goals || []) as { plan_id: string; status: string | null }[]) {
      const c = goalCounts.get(g.plan_id) || { total: 0, done: 0 };
      c.total += 1;
      if (g.status === "done" || g.status === "complete" || g.status === "achieved") c.done += 1;
      goalCounts.set(g.plan_id, c);
    }
  }

  const planCard = (type: string) => {
    const p = plansByType.get(type);
    if (!p) return { hasPlan: false, status: "not_started", title: "", updatedAt: null, goals: { total: 0, done: 0 } };
    return {
      hasPlan: true,
      status: p.status || "active",
      title: p.title || "",
      updatedAt: p.updated_at,
      goals: goalCounts.get(p.id) || { total: 0, done: 0 },
    };
  };

  // --- Finance (MTD / YTD net) ---
  const now = new Date();
  const yearStart = `${now.getUTCFullYear()}-01-01`;
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const { data: fin } = await supabase
    .from("finance_entries")
    .select("type, amount, occurred_on")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", yearStart);
  let ytdIncome = 0;
  let ytdExpense = 0;
  let mtdIncome = 0;
  let mtdExpense = 0;
  for (const e of (fin || []) as { type: string; amount: number | string | null; occurred_on: string | null }[]) {
    const amt = Number(e.amount ?? 0);
    const inMonth = (e.occurred_on || "") >= monthStart;
    if (e.type === "income") {
      ytdIncome += amt;
      if (inMonth) mtdIncome += amt;
    } else {
      ytdExpense += amt;
      if (inMonth) mtdExpense += amt;
    }
  }

  // --- Sales pipeline ---
  const { data: acts } = await supabase
    .from("sales_activities")
    .select("estimated_value, outcome, status")
    .eq("master_plan_id", masterPlanId);
  let pipelineValue = 0;
  let openCount = 0;
  for (const a of (acts || []) as { estimated_value: number | string | null; outcome: string | null; status: string | null }[]) {
    if (a.outcome === "won" || a.outcome === "lost") continue;
    pipelineValue += Number(a.estimated_value ?? 0);
    if (a.status !== "completed") openCount += 1;
  }

  // --- Forecast summary (expected scenario) ---
  let forecastSummary: { horizonMonths: number; expectedNet: number; baseMonthlyRevenue: number } | null = null;
  try {
    const f = await buildForecast(masterPlanId);
    const expected = f.scenarios.find((s) => s.key === "expected");
    forecastSummary = {
      horizonMonths: f.assumptions.horizonMonths,
      expectedNet: expected ? expected.totalNet : 0,
      baseMonthlyRevenue: f.baseMonthlyRevenue,
    };
  } catch {
    forecastSummary = null;
  }

  // --- Next upcoming review ---
  const { data: reviews } = await supabase
    .from("planning_reviews")
    .select("title, scheduled_for, status")
    .eq("master_plan_id", masterPlanId)
    .neq("status", "completed");
  const upcoming = ((reviews || []) as { title: string; scheduled_for: string | null }[])
    .sort((a, b) => (a.scheduled_for || "9999").localeCompare(b.scheduled_for || "9999"));
  const nextReview = upcoming[0] || null;

  return NextResponse.json({
    connected: true,
    plans: {
      business: planCard("business"),
      marketing: planCard("marketing"),
      sales: planCard("sales"),
    },
    finance: {
      mtdNet: Math.round(mtdIncome - mtdExpense),
      ytdNet: Math.round(ytdIncome - ytdExpense),
      ytdIncome: Math.round(ytdIncome),
      ytdExpense: Math.round(ytdExpense),
    },
    pipeline: { value: Math.round(pipelineValue), openCount },
    forecast: forecastSummary,
    nextReview: nextReview ? { title: nextReview.title, scheduledFor: nextReview.scheduled_for } : null,
    upcomingReviewCount: upcoming.length,
  });
}
