import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planningAssistant, planningSystem } from "@/lib/ai/planningAi";
import { saveInsight, latestInsight } from "@/lib/ai/planKnowledge";
import { memberAiGate } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";

// GET — the last assessment this client's assistant made (so it's there when they come back).
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ latest: null });
  const i = await latestInsight(masterPlanId, "finance");
  return NextResponse.json({ latest: i ? { ...i.content, assistant: i.assistant, createdAt: i.createdAt } : null });
}

// AI health assessment of the finance section: reads the client's ledger +
// budgets, computes a compact summary, and asks the bot to grade financial
// health, flag where expenses are out of line, and give specific steps.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  const year = new Date().getFullYear();

  const { data: eData } = await supabase
    .from("finance_entries")
    .select("type, amount, category, occurred_on")
    .eq("master_plan_id", masterPlanId)
    .gte("occurred_on", `${year}-01-01`);
  const entries = (eData || []) as { type: string; amount: number | string | null; category: string | null }[];

  if (entries.length === 0) {
    return NextResponse.json({
      empty: true,
      assessment: "No financial data yet. Add income and expenses (or import a statement) and I'll assess your health.",
      insights: [],
    });
  }

  let income = 0;
  let expense = 0;
  const catExp: Record<string, number> = {};
  for (const e of entries) {
    const amt = Number(e.amount ?? 0);
    if (e.type === "income") income += amt;
    else {
      expense += amt;
      const c = (e.category || "Uncategorized").trim() || "Uncategorized";
      catExp[c] = (catExp[c] || 0) + amt;
    }
  }
  const net = income - expense;
  const topExpenses = Object.entries(catExp)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const { data: bData } = await supabase
    .from("finance_budgets")
    .select("type, category, amount")
    .eq("master_plan_id", masterPlanId);
  const budgets = (bData || []) as { type: string; category: string; amount: number | string | null }[];

  const assistant = await planningAssistant();
  if (!assistant?.key || !masterPlanId) return NextResponse.json({ needsKey: true });
  const overCap = await memberAiGate();
  if (overCap) return overCap;
  const key = assistant.key;

  const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const dataText =
    `Year-to-date: income ${usd(income)}, expenses ${usd(expense)}, net ${usd(net)} ` +
    `(margin ${income > 0 ? Math.round((net / income) * 100) : 0}%). ` +
    `Top expense categories: ${topExpenses.map(([c, v]) => `${c} ${usd(v)}`).join(", ") || "none"}. ` +
    `Budgets (monthly): ${
      budgets.length
        ? budgets.map((b) => `${b.type}/${b.category || "overall"} ${usd(Number(b.amount ?? 0))}`).join(", ")
        : "none set"
    }.`;

  const sys = planningSystem(
    assistant,
    "a sharp, supportive financial analyst for this small business owner.",
    "Assess financial health from the data and be specific and practical. " +
    'Return STRICT JSON: {"score":<0-100 integer>,"assessment":"2-3 sentence plain-language health summary",' +
    '"insights":[{"title":"short","severity":"high|medium|low","detail":"what\'s off and why it matters","steps":["specific action", "..."]}]}. ' +
    "Focus insights on where expenses look high or out of line (vs income, vs budget, or vs typical small-business norms) and concrete ways to improve. " +
    "2-4 insights. Steps must be specific and doable. If things look healthy, say so and give 1-2 optimization ideas. Tie advice to their plans, budgets and goals where you can. Do not invent numbers not provided."
  );

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: dataText },
      ],
      max_tokens: 900,
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
    const result = {
      score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : null,
      assessment: String(parsed.assessment || "").trim() || "I couldn't summarize your health just now.",
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [],
    };
    // Stored with this client's plan, under their assistant's name.
    await saveInsight(masterPlanId, "finance", assistant.name, { ...result, summary: result.assessment });
    return NextResponse.json({ ...result, assistant: assistant.name });
  } catch (e) {
    console.error("POST /api/finance/analysis:", e);
    return NextResponse.json({ error: "Couldn't run the analysis — try again in a moment." }, { status: 502 });
  }
}
