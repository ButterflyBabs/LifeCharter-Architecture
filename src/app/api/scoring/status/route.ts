import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveOpenAiKey } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

// Whether a finished Brain or Soul has not been scored by AI yet (no key when it was finished, or the run failed), so the
// Alignment Profile can offer to score it now. Reads only; the run itself is POST /api/scoring/recompute.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ pending: [], hasKey: false });
  const db = createServerClient();
  const [{ data: done }, { data: plan }, key] = await Promise.all([
    db.from("assessment_completions").select("assessment_type").eq("master_plan_id", planId),
    db.from("client_master_plans").select("metadata").eq("id", planId).maybeSingle(),
    resolveOpenAiKey(),
  ]);
  const scored = Object.keys((plan?.metadata as { ai_scores?: Record<string, unknown> } | null)?.ai_scores ?? {});
  const finished = new Set(((done ?? []) as { assessment_type: string }[]).map((r) => r.assessment_type));
  const pending = ["brain", "soul"].filter((t) => finished.has(t) && !scored.some((k) => k.endsWith(`:${t}`)));
  return NextResponse.json({ pending, hasKey: Boolean(key) }, { headers: { "Cache-Control": "no-store" } });
}
