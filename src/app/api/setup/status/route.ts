import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { sessionUser } from "@/lib/authz";
import * as google from "@/lib/google";
import * as microsoft from "@/lib/microsoft";

export const dynamic = "force-dynamic";

// Live status of every setup step, so the wizard and Travel Partner widget both
// reflect real progress. Required to finish: the three assessments, a connected
// AI key, and at least one connected tool.
export async function GET() {
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  // --- Assessments ---
  let brain = false;
  let soul = false;
  let profit = false;
  if (masterPlanId) {
    try {
      // Count each assessment separately. (One combined query was capped at 500 rows, and
      // Brain alone has 535 answers, so Soul could fall off the end and look unstarted.)
      const has = async (type: "brain" | "soul") => {
        const { count } = await supabase
          .from("unified_client_responses")
          .select("id", { count: "exact", head: true })
          .eq("master_plan_id", masterPlanId)
          .eq("assessment_type", type);
        return (count ?? 0) > 0;
      };
      [brain, soul] = await Promise.all([has("brain"), has("soul")]);
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
  let poststream = false;
  if (masterPlanId) {
    try {
      const { data } = await supabase
        .from("client_integrations")
        .select("provider, api_key, status")
        .eq("master_plan_id", masterPlanId)
        .eq("provider", "poststream");
      for (const r of (data || []) as { provider: string; api_key: string | null; status: string | null }[]) {
        const has = Boolean((r.api_key || "").trim());
        if (r.provider === "poststream") poststream = has;
      }
    } catch {
      /* optional */
    }
  }

  // Per-account setup bypass (set on the profile) — skips the gate while building.
  let bypass = false;
  try {
    // The signed-in account's own setting (never another profile's).
    const user = await sessionUser();
    if (user) {
      const { data: prof } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
      const prefs = (prof?.preferences as Record<string, unknown>) || {};
      bypass = prefs.setupBypass === true || prefs.setupBypass === "true";
    }
  } catch {
    /* optional */
  }

  const assessmentsComplete = brain && soul && profit;
  // Connecting tools is required too — any single connection (calendar & email,
  // or PostStream) meets it.
  const toolsConnected = gConnected || mConnected || poststream;
  const requiredComplete = assessmentsComplete && ai && toolsConnected;

  return NextResponse.json({
    assessments: { brain, soul, profit, complete: assessmentsComplete },
    ai: { connected: ai },
    integrations: {
      calendar: gConnected || mConnected,
      google: gConnected,
      microsoft: mConnected,
      poststream,
    },
    tools: { connected: toolsConnected },
    requiredComplete,
    bypass,
  });
}
