import { NextResponse } from "next/server";

import { aiClient } from "@/lib/ai/client";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { memberAiGate } from "@/lib/ai/memberCap";
import { techTools } from "@/lib/finance/techTools";
import { formatMoney } from "@/lib/currency";

export const dynamic = "force-dynamic";

// GET — the client's tech-stack spend from the ledger.
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  const result = await techTools(masterPlanId);
  return NextResponse.json(result);
}

// POST — AI optimization of the tech stack (redundancies, savings, downgrades).
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const masterPlanId = await resolveMasterPlanId();
  const { tools, totalMonthly, currency: home, other } = await techTools(masterPlanId);
  if (tools.length === 0) {
    return NextResponse.json({ empty: true, summary: "", suggestions: [] });
  }

  const { name, key } = await resolveAiConfig();
  const overCap = await memberAiGate(key);
  if (overCap) return overCap;
  if (!key) return NextResponse.json({ needsKey: true });

  // Each tool in its own currency; the totals are kept apart per currency (task 1520).
  const money = (n: number, c: string) => formatMoney(n, c, { home, cents: false });
  const list = tools.map((t) => `${t.name}: ~${money(t.monthly, t.currency)}/mo`).join("; ");
  const sys =
    `You are ${name}, helping a small business owner optimize their software/subscription spend. ` +
    `Total is about ${money(totalMonthly, home)}/month${other ? ` plus ${money(other.totalMonthly, other.currency)}/month paid in ${other.currency.toUpperCase()} (a separate currency; never add the two)` : ""}. ` +
    `Give estMonthlySavings in ${home.toUpperCase()}. ` +
    'Return STRICT JSON: {"summary":"1-2 sentences","suggestions":[{"title":"short","detail":"why","steps":["specific action"],"estMonthlySavings":<number or 0>}]}. ' +
    "Look for likely overlapping/redundant tools, plans that could be downgraded or consolidated, and anything that looks under-used. Be specific and realistic; don't invent tools not listed. 2-4 suggestions.";

  try {
    const openai = aiClient(key);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Tools: ${list}` },
      ],
      max_tokens: 800,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    return NextResponse.json({
      summary: String(parsed.summary || "").trim(),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    });
  } catch (e) {
    console.error("POST /api/finance/techstack:", e);
    return NextResponse.json({ error: "Couldn't optimize just now." }, { status: 502 });
  }
}
