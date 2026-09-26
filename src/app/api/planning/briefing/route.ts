import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { planningAssistant, planningSystem, runJson, cleanList } from "@/lib/ai/planningAi";
import { latestInsight, saveInsight } from "@/lib/ai/planKnowledge";

export const dynamic = "force-dynamic";

// Where each planning area lives (the model picks the area; we pick the link).
const AREA_HREF: Record<string, string> = {
  business: "/business-plan",
  marketing: "/marketing-plan",
  sales: "/sales",
  forecasting: "/planning/forecast",
  finance: "/finance",
};

// GET — the last planning briefing this client's assistant wrote.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ latest: null });
  const [i, cfg] = await Promise.all([latestInsight(planId, "hub"), resolveAiConfig()]);
  return NextResponse.json({ assistantName: cfg.name, hasKey: Boolean(cfg.key), latest: i ? { ...i.content, assistant: i.assistant, createdAt: i.createdAt } : null });
}

// POST — a strategic briefing across all six planning areas, from what the
// client's assistant knows: what's solid, what's missing or out of step, and the
// next three planning moves. Stored under their assistant's name.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await planningAssistant();
  if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!a.key) return NextResponse.json({ needsKey: true });

  const system = planningSystem(
    a,
    "the client's strategic planning partner, giving a briefing across their Business Plan, Marketing Plan, Sales Plan, Forecasting and Finance.",
    "Look across everything in STRATEGIC PLANNING above (plus their scores and income) and tell them where their planning stands. Look for: what's well developed, what hasn't been started, and where the pieces don't agree (e.g. a sales plan with no weekly targets, a forecast with no budget, marketing without an ideal client, goals that have slipped). " +
      'Return STRICT JSON: {"summary":"2-3 sentences: the honest state of their planning","strengths":[{"title":"short","detail":"specific, tied to their data"}],' +
      '"gaps":[{"title":"short","detail":"what is missing or out of step, and why it matters"}],' +
      '"nextMoves":[{"area":"business|marketing|sales|forecasting|finance","title":"a specific next step","why":"one sentence"}]}. ' +
      "2-3 strengths, 2-4 gaps, exactly 3 next moves in priority order. If they've barely started, say so kindly and make the moves the best first steps. Never invent."
  );
  const out = await runJson(a, system, "Give me my planning briefing.", 1100);
  if (!out || !String(out.summary || "").trim()) return NextResponse.json({ error: "Couldn't write the briefing — try again." }, { status: 502 });

  const result = {
    summary: String(out.summary).trim().slice(0, 600),
    strengths: cleanList(out.strengths, 3, ["title", "detail"]),
    gaps: cleanList(out.gaps, 4, ["title", "detail"]),
    nextMoves: cleanList(out.nextMoves, 3, ["area", "title", "why"]).map((m) => ({ ...m, href: AREA_HREF[m.area] || "/planning" })),
  };
  await saveInsight(a.planId, "hub", a.name, result);
  return NextResponse.json({ ...result, assistant: a.name, createdAt: new Date().toISOString() });
}
