import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { latestInsight, saveInsight } from "@/lib/ai/planKnowledge";
import { LEGAL_ITEMS } from "@/lib/legalChecklist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "What applies to my business?": the client's own assistant reads everything it
// knows about them (industry, team, how they sell, their Profit-assessment legal
// answers) and marks which checklist items are priorities and which likely don't
// apply. Suggestions only; the client accepts each one. The latest is kept.

export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ suggestions: null });
  const i = await latestInsight(masterPlanId, "legal").catch(() => null);
  return NextResponse.json({ suggestions: i ? { ...i.content, createdAt: i.createdAt } : null });
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  const a = await planningAssistant();
  if (!masterPlanId || !a) return NextResponse.json({ error: "No account found." }, { status: 400 });
  if (!a.key) return NextResponse.json({ needsKey: true });
  const list = LEGAL_ITEMS.map((i) => `${i.key}: ${i.title}`).join("\n");
  const sys = planningSystem(
    a,
    "helping them see which legal & compliance items matter for their business. You are not a lawyer and never give legal advice.",
    'Return STRICT JSON: {"items":[{"key":"item key from the list","verdict":"priority|na","reason":"one short sentence tied to their business"}],"summary":"one sentence"}. ' +
      "Mark \"priority\" for up to 6 items that matter most for them now (e.g. contractor agreements if they use contractors, sales tax if they sell digital products, disclaimers for coaching). " +
      "Mark \"na\" only when what you know clearly shows it doesn't apply (e.g. no employees → worker classification may still apply to contractors, so be careful). Leave everything else out. Use only keys from the list."
  );
  const out = await runJson(a, sys, `CHECKLIST ITEMS:\n${list}`, 900);
  if (!out) return NextResponse.json({ error: "Couldn't review the checklist just now." }, { status: 502 });
  const keys = new Set(LEGAL_ITEMS.map((i) => i.key));
  const items = (Array.isArray(out.items) ? out.items : [])
    .map((x: Record<string, unknown>) => ({ key: String(x?.key || ""), verdict: x?.verdict === "na" ? "na" : "priority", reason: String(x?.reason || "").slice(0, 240) }))
    .filter((x: { key: string }) => keys.has(x.key))
    .slice(0, 20);
  const suggestions = { items, summary: String(out.summary || "").slice(0, 300) };
  await saveInsight(masterPlanId, "legal", a.name, suggestions).catch(() => {});
  return NextResponse.json({ suggestions });
}
