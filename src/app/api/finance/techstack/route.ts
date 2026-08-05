import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

// Expenses that look like software / subscriptions / SaaS.
const TECH_WORDS = [
  "software",
  "subscription",
  "saas",
  "app",
  "tool",
  "hosting",
  "domain",
  "license",
  "licence",
  "api",
  "platform",
  "membership",
  "seat",
  "cloud",
  "plan",
  "crm",
  "email",
  "automation",
  "analytics",
  "website",
];

function isTech(category: string, description: string): boolean {
  const hay = `${category} ${description}`.toLowerCase();
  return TECH_WORDS.some((w) => hay.includes(w));
}

async function techTools(masterPlanId: string | null) {
  const supabase = createServerClient();
  const year = new Date().getFullYear();
  const monthsElapsed = new Date().getMonth() + 1;
  const { data } = await supabase
    .from("finance_entries")
    .select("amount, category, description")
    .eq("master_plan_id", masterPlanId)
    .eq("type", "expense")
    .gte("occurred_on", `${year}-01-01`);

  const rows = (data || []) as { amount: number | string | null; category: string | null; description: string | null }[];
  const agg: Record<string, number> = {};
  for (const r of rows) {
    const cat = (r.category || "").trim();
    const desc = (r.description || "").trim();
    if (!isTech(cat, desc)) continue;
    const name = desc || cat || "Software";
    agg[name] = (agg[name] || 0) + Number(r.amount ?? 0);
  }
  const tools = Object.entries(agg)
    .map(([name, ytd]) => ({ name, ytd, monthly: Math.round(ytd / monthsElapsed) }))
    .sort((a, b) => b.ytd - a.ytd);
  const totalYtd = tools.reduce((s, t) => s + t.ytd, 0);
  return { tools, totalYtd, totalMonthly: Math.round(totalYtd / monthsElapsed), monthsElapsed };
}

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
  const { tools, totalMonthly } = await techTools(masterPlanId);
  if (tools.length === 0) {
    return NextResponse.json({ empty: true, summary: "", suggestions: [] });
  }

  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const list = tools.map((t) => `${t.name}: ~$${t.monthly}/mo`).join("; ");
  const sys =
    `You are ${name}, helping a small business owner optimize their software/subscription spend. ` +
    `Total is about $${totalMonthly}/month. ` +
    'Return STRICT JSON: {"summary":"1-2 sentences","suggestions":[{"title":"short","detail":"why","steps":["specific action"],"estMonthlySavings":<number or 0>}]}. ' +
    "Look for likely overlapping/redundant tools, plans that could be downgraded or consolidated, and anything that looks under-used. Be specific and realistic; don't invent tools not listed. 2-4 suggestions.";

  try {
    const openai = new OpenAI({ apiKey: key });
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
