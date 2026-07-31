import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Derives the "Next 3 Moves" from the weakest business dimensions: aggregates
// segment_dimensions by dimension, ranks by average score, and turns the three
// lowest into recommended moves.

const LABEL: Record<string, string> = {
  marketing: "Marketing", sales: "Sales", operations: "Operations", finance: "Finance",
  team: "Team", systems: "Systems", leadership: "Leadership", vision: "Vision",
  product: "Product", customer_experience: "Client Experience", legal: "Legal",
  sustainability: "Sustainability",
};

const ACTION: Record<string, string> = {
  marketing: "Sharpen demand generation",
  sales: "Build a repeatable pipeline",
  operations: "Streamline delivery operations",
  finance: "Tighten cash flow & margins",
  team: "Clarify roles & capacity",
  systems: "Document SOPs and automate",
  leadership: "Reclaim founder capacity",
  vision: "Recommit to strategic priorities",
  product: "Refine your core offer",
  customer_experience: "Improve the client journey",
  legal: "Close compliance gaps",
  sustainability: "Shore up long-term resilience",
};

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("segment_dimensions").select("dimension_key, score");

  if (error) {
    console.error("GET /api/next-moves:", error.message);
    return NextResponse.json({ moves: [], error: error.message }, { status: 200 });
  }

  const agg = new Map<string, { total: number; count: number }>();
  for (const row of (data ?? []) as Array<{ dimension_key: string; score: number }>) {
    const a = agg.get(row.dimension_key) ?? { total: 0, count: 0 };
    a.total += Number(row.score ?? 0);
    a.count += 1;
    agg.set(row.dimension_key, a);
  }

  const ranked = Array.from(agg.entries())
    .map(([key, a]) => ({ key, avg: Math.round(a.total / a.count), count: a.count }))
    .sort((x, y) => x.avg - y.avg)
    .slice(0, 3);

  // Impact reflects priority rank (these are already the three weakest), with an
  // escalation if a domain is genuinely low in absolute terms.
  const moves = ranked.map((r, i) => ({
    id: i + 1,
    title: ACTION[r.key] ?? `Strengthen ${LABEL[r.key] ?? r.key}`,
    subtitle: `${LABEL[r.key] ?? r.key} · ${r.avg}/100 across ${r.count} segment${r.count === 1 ? "" : "s"}`,
    impact: r.avg < 65 ? "High" : i === 0 ? "High" : i === 1 ? "Medium" : "Low",
  }));

  return NextResponse.json({ moves });
}
