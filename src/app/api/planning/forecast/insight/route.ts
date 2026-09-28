import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { planningAssistant, planningSystem, runJson, cleanList } from "@/lib/ai/planningAi";
import { latestInsight, saveInsight } from "@/lib/ai/planKnowledge";
import { buildForecast } from "@/lib/planning/forecastData";
import { memberAiGate } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// GET — the last forecast read this client's assistant wrote (and its name).
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ latest: null });
  const [i, cfg] = await Promise.all([latestInsight(planId, "forecast"), resolveAiConfig()]);
  return NextResponse.json({ assistantName: cfg.name, hasKey: Boolean(cfg.key), latest: i ? { ...i.content, assistant: i.assistant, createdAt: i.createdAt } : null });
}

// POST — the assistant reads the forecast against the plans, budgets, pipeline
// and goals, says what it means, and suggests income goals. Stored with the
// client's account under their assistant's name.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await planningAssistant();
  if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!a.key) return NextResponse.json({ needsKey: true });
  const overCap = await memberAiGate();
  if (overCap) return overCap;

  const f = await buildForecast(a.planId);
  if (f.baseMonthlyRevenue <= 0) {
    return NextResponse.json({ error: "There isn't enough income history to forecast yet. Add some income in your Finance Center and I'll read it." }, { status: 400 });
  }
  const scen = f.scenarios
    .map((s) => `${s.key}: revenue ${usd(s.totalRevenue)}, net ${usd(s.totalNet)}`)
    .join("; ");
  const data =
    `Forecast horizon ${f.assumptions.horizonMonths} months. Assumptions: ${f.assumptions.monthlyGrowthPct}% monthly growth, ${f.assumptions.pipelineClosePct}% of open pipeline closes, expenses at ${f.assumptions.expenseRatioPct}% of revenue (0 = use their history). ` +
    `Current base revenue ${usd(f.baseMonthlyRevenue)}/month. Scenarios — ${scen}.`;

  const system = planningSystem(
    a,
    "a sharp, supportive financial strategist reading this client's forecast.",
    "Explain in plain language what the forecast means for THEM, weighed against their Business/Sales plans, budgets, pipeline and current income goals above. " +
      'Return STRICT JSON: {"summary":"2-3 sentences: where they are heading and how confident to be","risks":[{"title":"short","detail":"what could go wrong, tied to their data"}],' +
      '"opportunities":[{"title":"short","detail":"a real lever, tied to their plans or pipeline"}],"actions":[{"title":"short","detail":"a specific next step this month"}],' +
      '"suggestedMonthlyIncomeGoal":<number: a realistic but stretching monthly income goal in dollars, grounded in the expected scenario>,"goalReason":"one sentence why"}. ' +
      "2-3 risks, 2-3 opportunities, 3 actions. Never invent numbers beyond those shown; the goal must be reasoned from the expected scenario and their base revenue."
  );
  const out = await runJson(a, system, data, 1100);
  if (!out || !String(out.summary || "").trim()) return NextResponse.json({ error: "Couldn't read the forecast — try again." }, { status: 502 });

  // Keep the suggested goal in a sane band around what the forecast supports.
  const expected = f.scenarios.find((s) => s.key === "expected");
  const avgExpected = expected && f.assumptions.horizonMonths ? expected.totalRevenue / f.assumptions.horizonMonths : f.baseMonthlyRevenue;
  let goal = Number(out.suggestedMonthlyIncomeGoal);
  if (!Number.isFinite(goal) || goal <= 0) goal = avgExpected;
  goal = Math.round(Math.min(Math.max(goal, avgExpected * 0.6), avgExpected * 2) / 50) * 50;

  const result = {
    summary: String(out.summary).trim().slice(0, 600),
    risks: cleanList(out.risks, 3, ["title", "detail"]),
    opportunities: cleanList(out.opportunities, 3, ["title", "detail"]),
    actions: cleanList(out.actions, 3, ["title", "detail"]),
    suggestedMonthlyIncomeGoal: goal,
    goalReason: String(out.goalReason || "").trim().slice(0, 300),
  };
  await saveInsight(a.planId, "forecast", a.name, result);
  return NextResponse.json({ ...result, assistant: a.name, createdAt: new Date().toISOString() });
}
