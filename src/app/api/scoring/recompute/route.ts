import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getOrCreatePrimaryMasterPlan } from "@/lib/scoring/masterPlan";
import { DIMENSION_MODEL, DimensionKey } from "@/lib/scoring/dimensionModel";
import { scoreDimensionFromProse, isAiConfigured, ProseAnswer } from "@/lib/scoring/aiScore";

export const dynamic = "force-dynamic";

// Runs AI scoring over the stored Soul answers and caches a 0-100 per-dimension
// AI score (+ rationale) into client_master_plans.metadata.ai_scores. The live
// /api/alignment then blends these in cheaply (no OpenAI call per page load).
//
// Sensitivity: flagged answers (answer_value.sensitive === true) are dropped
// before anything reaches the model. Verbatim answers are never stored.

type SoulRow = {
  section_name: string | null;
  question_text: string;
  answer_text: string | null;
  answer_value: { value?: unknown; sensitive?: boolean } | null;
  answered_at: string | null;
};

export async function POST() {
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "OpenAI is not configured (missing openai_api_key / OPENAI_API_KEY).", configured: false },
      { status: 400 }
    );
  }

  const planId = await getOrCreatePrimaryMasterPlan();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();

  const { data } = await supabase
    .from("unified_client_responses")
    .select("section_name, question_text, answer_text, answer_value, answered_at")
    .eq("master_plan_id", planId)
    .eq("assessment_type", "soul");

  const rows = (data ?? []) as SoulRow[];
  // Drop flagged-sensitive answers entirely before scoring.
  const usable = rows.filter((r) => !(r.answer_value && r.answer_value.sensitive === true));

  const bySection = new Map<string, ProseAnswer[]>();
  let latestAt: string | null = null;
  for (const r of usable) {
    const text = (r.answer_text ?? String(r.answer_value?.value ?? "")).trim();
    if (!r.section_name || !text) continue;
    const arr = bySection.get(r.section_name) ?? [];
    arr.push({ question: r.question_text, answer: text });
    bySection.set(r.section_name, arr);
    if (r.answered_at && (!latestAt || new Date(r.answered_at) > new Date(latestAt))) {
      latestAt = r.answered_at;
    }
  }

  const at = latestAt ?? new Date().toISOString();
  const aiScores: Record<string, { score: number; rationale: string; answeredAt: string }> = {};

  // For every dimension that has a Soul source, score from that source's sections.
  for (const def of DIMENSION_MODEL) {
    const soulSource = def.sources.find((s) => s.kind === "soul");
    if (!soulSource?.soulSections) continue;
    const answers: ProseAnswer[] = [];
    for (const sec of soulSource.soulSections) {
      answers.push(...(bySection.get(sec) ?? []));
    }
    if (answers.length === 0) continue;
    const result = await scoreDimensionFromProse(def.key as DimensionKey, def.label, answers);
    if (result) {
      aiScores[def.key] = { score: result.score, rationale: result.rationale, answeredAt: at };
    }
  }

  // Merge into existing metadata (preserve anything else there).
  const { data: mp } = await supabase
    .from("client_master_plans")
    .select("metadata")
    .eq("id", planId)
    .maybeSingle();
  const metadata = { ...((mp?.metadata as Record<string, unknown>) ?? {}), ai_scores: aiScores };

  const { error: upErr } = await supabase
    .from("client_master_plans")
    .update({ metadata, soul_score: overallOf(aiScores), updated_at: new Date().toISOString() })
    .eq("id", planId);

  if (upErr) {
    console.error("recompute update:", upErr.message);
    return NextResponse.json({ error: "failed to store ai scores" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    scoredDimensions: Object.keys(aiScores).length,
    aiScores,
    usableAnswers: usable.length,
    droppedSensitive: rows.length - usable.length,
  });
}

function overallOf(scores: Record<string, { score: number }>): number | null {
  const vals = Object.values(scores).map((s) => s.score);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
