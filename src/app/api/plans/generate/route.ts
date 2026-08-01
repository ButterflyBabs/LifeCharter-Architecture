import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { gatherAndCompute } from "@/lib/scoring/gather";
import { isAiConfigured, ProseAnswer } from "@/lib/scoring/aiScore";
import { generatePlan, PlanType } from "@/lib/plans/generatePlan";

export const dynamic = "force-dynamic";

// Generates an AI Business / Marketing / Sales plan from the client's own
// assessment evidence and stores it as a new active version, superseding the
// previous one. Keyed on master_plan_id (per-client). Sensitive-flagged Soul
// answers are dropped before anything reaches the model.

const VALID: PlanType[] = ["business", "marketing", "sales"];
const MAX_ANSWERS = 60;
const MAX_ANSWER_CHARS = 500;

type Row = {
  assessment_type: string;
  question_text: string;
  answer_text: string | null;
  answer_value: { value?: unknown; sensitive?: boolean } | null;
};

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "OpenAI is not configured (missing openai_api_key / OPENAI_API_KEY).", configured: false },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const planType = body?.planType as PlanType;
  if (!VALID.includes(planType)) {
    return NextResponse.json({ error: "planType must be business, marketing, or sales" }, { status: 400 });
  }

  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();

  // Evidence: the client's own Soul + Brain answers (sensitive dropped).
  const { data } = await supabase
    .from("unified_client_responses")
    .select("assessment_type, question_text, answer_text, answer_value")
    .eq("master_plan_id", planId)
    .in("assessment_type", ["soul", "brain"]);
  const rows = (data ?? []) as Row[];
  const answers: ProseAnswer[] = [];
  for (const r of rows) {
    if (r.answer_value && r.answer_value.sensitive === true) continue; // drop flagged
    const text = (r.answer_text ?? String(r.answer_value?.value ?? "")).trim();
    if (!r.question_text || !text) continue;
    answers.push({ question: r.question_text, answer: text.slice(0, MAX_ANSWER_CHARS) });
    if (answers.length >= MAX_ANSWERS) break;
  }

  // Current 12-dimension scores (weakest-first steering happens in the generator).
  const computed = await gatherAndCompute(planId);
  const scores = computed.domains.map((d) => ({ key: d.key, label: d.label, score: d.score }));

  const generated = await generatePlan({ planType, scores, answers });
  if (!generated) {
    return NextResponse.json(
      { error: "generation produced no plan (insufficient evidence or model error)" },
      { status: 422 }
    );
  }

  // Supersede the current active plan of this type and compute the next version.
  const { data: prev } = await supabase
    .from("client_plans")
    .select("id, version")
    .eq("master_plan_id", planId)
    .eq("plan_type", planType)
    .eq("status", "active")
    .maybeSingle();
  const nextVersion = (prev?.version ?? 0) + 1;
  if (prev?.id) {
    await supabase.from("client_plans").update({ status: "superseded" }).eq("id", prev.id);
  }

  const { data: created, error: insErr } = await supabase
    .from("client_plans")
    .insert({
      master_plan_id: planId,
      plan_type: planType,
      version: nextVersion,
      status: "active",
      generated_by: "ai",
      title: generated.title,
      summary: generated.summary,
      source_snapshot: {
        generated_at: new Date().toISOString(),
        overall: computed.overall,
        answer_count: answers.length,
        scores: scores.filter((s) => s.score !== null),
      },
    })
    .select("id, version, plan_type, title, summary, status, created_at")
    .single();

  if (insErr || !created) {
    console.error("plan insert:", insErr?.message);
    return NextResponse.json({ error: "failed to store plan" }, { status: 500 });
  }

  const goalRows = generated.goals.map((g, i) => ({
    plan_id: created.id,
    dimension_key: g.dimension_key,
    title: g.title,
    detail: g.detail,
    target: g.target,
    status: "not_started",
    sort_order: i,
  }));
  const { data: goals, error: goalErr } = await supabase
    .from("client_plan_goals")
    .insert(goalRows)
    .select("id, dimension_key, title, detail, target, status, sort_order");
  if (goalErr) {
    console.error("plan goals insert:", goalErr.message);
  }

  return NextResponse.json(
    { ok: true, plan: created, goals: goals ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
