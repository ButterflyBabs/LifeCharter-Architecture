import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

// The assistant proposes a monthly expense budget from what the client actually
// spent (the last three months, by their own categories), shaped by their plans
// and forecast. Only categories they really use can be suggested. Nothing is
// saved here — the client reviews and applies.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await planningAssistant();
  if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!a.key) return NextResponse.json({ needsKey: true });

  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 3);
  since.setUTCDate(1);
  const { data } = await createServerClient()
    .from("finance_entries")
    .select("category, amount")
    .eq("master_plan_id", a.planId)
    .eq("type", "expense")
    .gte("occurred_on", since.toISOString().slice(0, 10));
  const spent: Record<string, number> = {};
  for (const r of (data ?? []) as { category: string | null; amount: number | string | null }[]) {
    const c = (r.category || "Uncategorized").trim() || "Uncategorized";
    spent[c] = (spent[c] ?? 0) + Number(r.amount ?? 0);
  }
  const cats = Object.entries(spent).sort((x, y) => y[1] - x[1]).slice(0, 14);
  if (cats.length === 0) return NextResponse.json({ error: "Add some expenses first — I build the budget from what you actually spend." }, { status: 400 });
  const avg = (v: number) => Math.round(v / 3);

  const system = planningSystem(
    a,
    "a practical financial advisor proposing this client's monthly expense budget.",
    "Propose a monthly budget for each category listed, starting from their real average spend and adjusting for their plans, forecast and income goal above (trim what's high relative to income; protect what supports their plans). " +
      'Return STRICT JSON: {"budget":[{"category":"exact category name","amount":<whole dollars per month>,"note":"one short reason"}],"summary":"1-2 sentences on the approach"}. ' +
      "Use ONLY the categories given, with their exact names."
  );
  const out = await runJson(a, system, `Average monthly spend over the last 3 months:\n${cats.map(([c, v]) => `- ${c}: $${avg(v)}`).join("\n")}`, 900, 0.3);
  if (!out) return NextResponse.json({ error: "Couldn't suggest a budget — try again." }, { status: 502 });

  const known = new Map(cats.map(([c]) => [c.toLowerCase(), c]));
  const budget = (Array.isArray(out.budget) ? out.budget : [])
    .map((b) => {
      const r = b as Record<string, unknown>;
      const category = known.get(String(r.category ?? "").trim().toLowerCase());
      const amount = Math.round(Number(r.amount));
      return category && Number.isFinite(amount) && amount >= 0 ? { category, amount, average: avg(spent[category]), note: String(r.note ?? "").trim().slice(0, 160) } : null;
    })
    .filter((b): b is { category: string; amount: number; average: number; note: string } => b !== null);
  if (!budget.length) return NextResponse.json({ error: "Couldn't suggest a budget — try again." }, { status: 502 });
  return NextResponse.json({ budget, summary: String(out.summary || "").trim().slice(0, 300), assistant: a.name });
}
