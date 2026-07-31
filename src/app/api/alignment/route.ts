import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Aggregates segment_dimensions across all segments into the 12-domain
// alignment scores, overall business health, and focus areas — the live data
// behind the Business Alignment dashboard cards.

const ORDER = [
  "marketing", "sales", "operations", "finance", "team", "systems",
  "leadership", "vision", "product", "customer_experience", "legal", "sustainability",
];
const NAME: Record<string, string> = {
  marketing: "Marketing", sales: "Sales", operations: "Operations", finance: "Finance",
  team: "Team", systems: "Systems", leadership: "Leadership", vision: "Vision",
  product: "Product", customer_experience: "Client Exp", legal: "Legal", sustainability: "Sustainability",
};
const ICON: Record<string, string> = {
  marketing: "M", sales: "S", operations: "O", finance: "F", team: "T", systems: "Sy",
  leadership: "L", vision: "V", product: "P", customer_experience: "C", legal: "Le", sustainability: "Su",
};

function phase(overall: number): string {
  if (overall <= 40) return "Survival";
  if (overall <= 60) return "Growth";
  if (overall <= 80) return "Expansion";
  return "Legacy";
}

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("segment_dimensions").select("dimension_key, score");

  if (error || !data || data.length === 0) {
    if (error) console.error("GET /api/alignment:", error.message);
    return NextResponse.json({ hasData: false, domains: [] });
  }

  const agg = new Map<string, { total: number; count: number }>();
  for (const row of data as Array<{ dimension_key: string; score: number }>) {
    const a = agg.get(row.dimension_key) ?? { total: 0, count: 0 };
    a.total += Number(row.score ?? 0);
    a.count += 1;
    agg.set(row.dimension_key, a);
  }

  const domains = ORDER.filter((k) => agg.has(k)).map((k) => {
    const a = agg.get(k)!;
    return { key: k, name: NAME[k] ?? k, icon: ICON[k] ?? "•", score: Math.round(a.total / a.count) };
  });

  if (domains.length === 0) return NextResponse.json({ hasData: false, domains: [] });

  const overall = Math.round(domains.reduce((s, d) => s + d.score, 0) / domains.length);
  const focusAreas = [...domains].sort((a, b) => a.score - b.score).slice(0, 3).map((d) => d.name);
  const status = phase(overall);

  console.log(`[alignment] overall=${overall} rows=${data.length} focus=${focusAreas.join(",")}`);

  return NextResponse.json(
    {
      hasData: true,
      overall,
      status,
      focusAreas,
      description:
        "Live from your segment dimension scores. Your lowest domains are where the next gains are — start there.",
      domains,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
