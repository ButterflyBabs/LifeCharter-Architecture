import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// Live status of every setup step, so the wizard and Travel Partner widget both
// reflect real progress. Foundation-first: assessments + a connected AI key are
// what's required to finish; integrations are encouraged but optional.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  // --- Assessments ---
  let brain = false;
  let soul = false;
  let profit = false;
  if (masterPlanId) {
    try {
      const { data } = await supabase
        .from("unified_client_responses")
        .select("assessment_type")
        .eq("master_plan_id", masterPlanId)
        .in("assessment_type", ["brain", "soul"])
        .limit(500);
      for (const r of (data || []) as { assessment_type: string }[]) {
        if (r.assessment_type === "brain") brain = true;
        if (r.assessment_type === "soul") soul = true;
      }
    } catch {
      /* optional */
    }
    try {
      const { data: mp } = await supabase
        .from("client_master_plans")
        .select("domain_scores, profit_score")
        .eq("id", masterPlanId)
        .maybeSingle();
      const ds = (mp?.domain_scores as Record<string, unknown> | null) || null;
      profit = Boolean((ds && Object.keys(ds).length > 0) || (mp?.profit_score as number | null));
    } catch {
      /* optional */
    }
  }

  // --- AI ---
  let ai = false;
  try {
    const { key } = await resolveAiConfig();
    ai = Boolean(key);
  } catch {
    /* optional */
  }

  // --- Integrations ---
  const [gConnected, mConnected] = await Promise.all([
    google.isConnected().catch(() => false),
    microsoft.isConnected().catch(() => false),
  ]);
  let globalControl = false;
  let poststream = false;
  if (masterPlanId) {
    try {
      const { data } = await supabase
        .from("client_integrations")
        .select("provider, api_key, status")
        .eq("master_plan_id", masterPlanId)
        .in("provider", ["global_control", "poststream"]);
      for (const r of (data || []) as { provider: string; api_key: string | null; status: string | null }[]) {
        const has = Boolean((r.api_key || "").trim());
        if (r.provider === "global_control") globalControl = has;
        if (r.provider === "poststream") poststream = has;
      }
    } catch {
      /* optional */
    }
  }

  // Per-account setup bypass (set on the profile) — skips the gate while building.
  let bypass = false;
  try {
    const { data: prof } = await supabase.from("profiles").select("preferences").limit(1).maybeSingle();
    const prefs = (prof?.preferences as Record<string, unknown>) || {};
    bypass = prefs.setupBypass === true || prefs.setupBypass === "true";
  } catch {
    /* optional */
  }

  const assessmentsComplete = brain && soul && profit;
  const requiredComplete = assessmentsComplete && ai;

  return NextResponse.json({
    assessments: { brain, soul, profit, complete: assessmentsComplete },
    ai: { connected: ai },
    integrations: {
      calendar: gConnected || mConnected,
      google: gConnected,
      microsoft: mConnected,
      globalControl,
      poststream,
    },
    requiredComplete,
    bypass,
  });
}
