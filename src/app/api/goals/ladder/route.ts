import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planningAssistant, planningSystem, runJson, cleanList } from "@/lib/ai/planningAi";
import { CHILD_OF, periodLabel, type GoalPeriod } from "@/lib/goalLadder";

export const dynamic = "force-dynamic";

// The goal ladder: every active plan's goals, with their quarter/month/week
// breakdowns.
//   GET                                            → plans + all goals
//   POST { action: "add", parentId, title, target?, periodStart }
//   POST { action: "suggest", parentId }           → 3 suggested next-level goals (not saved)
//   DELETE { id }                                  → removes a breakdown goal (never a plan's own goal)

const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function ownGoal(masterPlanId: string, id: string) {
  const db = createServerClient();
  const { data: g } = await db.from("client_plan_goals").select("id, plan_id, title, target, period, period_start, dimension_key").eq("id", id).maybeSingle();
  if (!g) return null;
  const { data: plan } = await db.from("client_plans").select("master_plan_id").eq("id", g.plan_id).maybeSingle();
  return plan?.master_plan_id === masterPlanId ? g : null;
}

export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ plans: [], goals: [] });
  const db = createServerClient();
  const { data: plans } = await db.from("client_plans").select("id, plan_type, title").eq("master_plan_id", masterPlanId).eq("status", "active");
  const ids = ((plans || []) as { id: string }[]).map((p) => p.id);
  const { data: goals } = ids.length
    ? await db
        .from("client_plan_goals")
        .select("id, plan_id, parent_id, period, period_start, title, target, status, sort_order, dimension_key")
        .in("plan_id", ids)
        .order("sort_order")
    : { data: [] };
  return NextResponse.json({ plans: plans ?? [], goals: goals ?? [] });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const parent = typeof body.parentId === "string" ? await ownGoal(masterPlanId, body.parentId) : null;
  if (!parent) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  const childPeriod = CHILD_OF[(parent.period as GoalPeriod) || "year"];
  if (!childPeriod) return NextResponse.json({ error: "Weekly goals are the smallest step." }, { status: 400 });

  if (body.action === "suggest") {
    const a = await planningAssistant();
    if (!a?.key) return NextResponse.json({ needsKey: true });
    const sys = planningSystem(
      a,
      "helping them break a goal into smaller goals.",
      `Return STRICT JSON: {"goals":[{"title":"a ${childPeriod} goal, specific and measurable (max 90 chars)","target":"how they'll know it's met (short)"}]} with 3 goals that together move the parent goal forward. Use their real offers, numbers and plans.`
    );
    const out = await runJson(a, sys, `PARENT GOAL (${periodLabel(parent.period as GoalPeriod, parent.period_start)}): ${parent.title}${parent.target ? ` — target: ${parent.target}` : ""}`, 600);
    return NextResponse.json({ suggestions: cleanList(out?.goals, 3, ["title", "target"]) });
  }

  if (body.action === "add") {
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const periodStart = typeof body.periodStart === "string" && DATE.test(body.periodStart) ? body.periodStart : null;
    if (!title || !periodStart) return NextResponse.json({ error: "Give the goal a title and choose when it's for." }, { status: 400 });
    const { data, error } = await createServerClient()
      .from("client_plan_goals")
      .insert({
        plan_id: parent.plan_id,
        parent_id: parent.id,
        period: childPeriod,
        period_start: periodStart,
        title,
        target: typeof body.target === "string" ? body.target.trim().slice(0, 200) || null : null,
        dimension_key: parent.dimension_key,
        status: "not_started",
        sort_order: 0,
      })
      .select("id, plan_id, parent_id, period, period_start, title, target, status, sort_order, dimension_key")
      .single();
    if (error) {
      console.error("goal ladder add:", error.message);
      return NextResponse.json({ error: "Couldn't save that goal." }, { status: 500 });
    }
    return NextResponse.json({ goal: data });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  const body = await request.json().catch(() => ({}));
  const g = masterPlanId && typeof body.id === "string" ? await ownGoal(masterPlanId, body.id) : null;
  if (!g || g.period === "year") return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  await createServerClient().from("client_plan_goals").delete().eq("id", g.id);
  return NextResponse.json({ ok: true });
}
