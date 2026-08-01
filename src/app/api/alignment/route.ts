import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { gatherAndCompute } from "@/lib/scoring/gather";

export const dynamic = "force-dynamic";

// The live data behind the Business Alignment cards. Prefers assessment-derived
// scores (from the scoring engine) when any assessment data exists; otherwise
// falls back to the manual segment-dimension sliders. The `source` field tells
// the UI which one it's showing.

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

function buildResponse(
  overall: number,
  domains: Array<{ key: string; name: string; icon: string; score: number }>,
  source: "assessments" | "segments",
  extra: Record<string, unknown> = {}
) {
  const focusAreas = [...domains].sort((a, b) => a.score - b.score).slice(0, 3).map((d) => d.name);
  return NextResponse.json(
    {
      hasData: true,
      overall,
      status: phase(overall),
      focusAreas,
      source,
      description:
        source === "assessments"
          ? "Scored from your assessments and check-ins. Lowest domains are where the next gains are."
          : "Live from your segment dimension scores. Your lowest domains are where the next gains are — start there.",
      domains,
      ...extra,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Fallback: aggregate the manual segment_dimensions sliders (legacy behavior).
async function fromSegments() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("segment_dimensions").select("dimension_key, score");
  if (error || !data || data.length === 0) {
    if (error) console.error("GET /api/alignment (segments):", error.message);
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
  return buildResponse(overall, domains, "segments");
}

export async function GET() {
  // Prefer assessment-derived scores when any exist.
  try {
    const computed = await gatherAndCompute();
    if (computed.hasData && computed.overall !== null) {
      const domains = computed.domains
        .filter((d) => d.score !== null)
        .map((d) => ({
          key: d.key,
          name: NAME[d.key] ?? d.label,
          icon: ICON[d.key] ?? "•",
          score: d.score as number,
        }));
      return buildResponse(computed.overall, domains, "assessments", {
        partial: computed.partial,
        breakdown: computed.domains, // per-source detail for the "why this score" view
      });
    }
  } catch (e) {
    console.error("GET /api/alignment (assessments):", e);
    // fall through to segments
  }
  return fromSegments();
}
