import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { latestInsight, saveInsight, type InsightArea } from "@/lib/ai/planKnowledge";
import { memberAiGate } from "@/lib/ai/memberCap";

// A GET/POST pair for "the client's assistant reads X and says what it means":
// GET returns the last one it wrote (stored with the account, under the
// assistant's name); POST writes a fresh one from everything it knows. Used by
// the Alignment pages. `shape` turns the model's JSON into the stored result.
export function insightRoute(cfg: {
  area: InsightArea;
  role: string;
  rules: string; // task rules incl. the JSON shape to return
  ask: string | ((planId: string) => Promise<string>); // the user message (or built from this client's data)
  shape: (out: Record<string, unknown>) => Record<string, unknown> | null;
  maxTokens?: number;
}) {
  async function GET() {
    const planId = await resolveMasterPlanId();
    if (!planId) return NextResponse.json({ latest: null });
    const [i, ai] = await Promise.all([latestInsight(planId, cfg.area), resolveAiConfig()]);
    return NextResponse.json({ assistantName: ai.name, hasKey: Boolean(ai.key), latest: i ? { ...i.content, assistant: i.assistant, createdAt: i.createdAt } : null });
  }

  async function POST(request: Request) {
    if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
    const a = await planningAssistant();
    if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    if (!a.key) return NextResponse.json({ needsKey: true });
    const overCap = await memberAiGate();
    if (overCap) return overCap;
    const ask = typeof cfg.ask === "function" ? await cfg.ask(a.planId) : cfg.ask;
    const out = await runJson(a, planningSystem(a, cfg.role, cfg.rules), ask, cfg.maxTokens ?? 1100);
    const result = out ? cfg.shape(out) : null;
    if (!result) return NextResponse.json({ error: "Couldn't write that — try again." }, { status: 502 });
    await saveInsight(a.planId, cfg.area, a.name, result);
    return NextResponse.json({ ...result, assistant: a.name, createdAt: new Date().toISOString() });
  }

  return { GET, POST };
}

export const text = (v: unknown, max = 600) => String(v ?? "").trim().slice(0, max);
