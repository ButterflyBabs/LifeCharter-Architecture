import { NextResponse } from "next/server";
import { phaseFor } from "@/lib/scoring/phase";
import { gatherAndCompute, isMeaningful } from "@/lib/scoring/gather";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The live data behind the Business Alignment cards. Scores come only from
// completed assessments (via the scoring engine); there is no manual-slider
// fallback. When nothing is assessed yet, hasData is false and the UI prompts
// the client to complete their assessments.

const NAME: Record<string, string> = {
  marketing: "Marketing", sales: "Sales", operations: "Operations", finance: "Finance",
  team: "Team", systems: "Systems", leadership: "Leadership", vision: "Vision",
  product: "Product", customer_experience: "Client Exp", legal: "Legal", sustainability: "Sustainability",
};
const ICON: Record<string, string> = {
  marketing: "M", sales: "S", operations: "O", finance: "F", team: "T", systems: "Sy",
  leadership: "L", vision: "V", product: "P", customer_experience: "C", legal: "Le", sustainability: "Su",
};

const phase = phaseFor;

function buildResponse(
  overall: number,
  domains: Array<{ key: string; name: string; icon: string; score: number; delta?: number | null }>,
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

export async function GET() {
  // Scores come only from completed assessments — no manual-slider fallback.
  // When nothing has been assessed, the UI shows an "assessments required" state.
  try {
    const planId = await resolveMasterPlanId();
    const computed = await gatherAndCompute(planId);
    if (computed.hasData && computed.overall !== null && isMeaningful(computed.domains)) {
      // Movement since their baseline snapshot (null when there isn't one to compare to).
      let baseDomains: Record<string, number> = {};
      if (planId) {
        const { data: snap } = await createServerClient().from("client_score_snapshots").select("domains").eq("master_plan_id", planId).eq("snapshot_type", "baseline").maybeSingle();
        baseDomains = ((snap?.domains ?? {}) as Record<string, number>) || {};
      }
      const domains = computed.domains
        .filter((d) => d.score !== null)
        .map((d) => ({
          key: d.key,
          name: NAME[d.key] ?? d.label,
          icon: ICON[d.key] ?? "•",
          score: d.score as number,
          delta: typeof baseDomains[d.key] === "number" ? Math.round(d.score as number) - baseDomains[d.key] : null,
        }));
      return buildResponse(computed.overall, domains, "assessments", {
        partial: computed.partial,
        breakdown: computed.domains, // per-source detail for the "why this score" view
      });
    }
  } catch (e) {
    console.error("GET /api/alignment:", e);
  }
  return NextResponse.json(
    { hasData: false, needsAssessment: true, domains: [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
