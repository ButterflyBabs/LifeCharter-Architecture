import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { DIMENSION_MODEL, DimensionKey } from "@/lib/scoring/dimensionModel";
import { scoreDimensionFromProse, isAiConfigured, ProseAnswer } from "@/lib/scoring/aiScore";
import { gatherAndCompute } from "@/lib/scoring/gather";
import { captureSnapshot } from "@/lib/scoring/snapshot";
import { aiActionAllowed, recordAiAction, AI_LIMIT_BODY } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

// Runs AI scoring over the stored Soul AND Brain answers and caches a 0-100
// sub-score (+ rationale) per dimension+source into
// client_master_plans.metadata.ai_scores, keyed "${dimension}:${kind}" (e.g.
// "leadership:soul", "leadership:brain"). The live /api/alignment blends these
// in cheaply (no OpenAI call per page load).
//
// Sensitivity: flagged answers (answer_value.sensitive === true) are dropped
// before anything reaches the model. Verbatim answers are never stored.

type Row = {
  assessment_type: string;
  section_name: string | null;
  question_text: string;
  answer_text: string | null;
  answer_value: { value?: unknown; sensitive?: boolean } | null;
  answered_at: string | null;
};

// Caps to keep token use bounded on large assessments (Brain has 500+ items).
const MAX_ANSWERS_PER_SOURCE = 40;
const MAX_ANSWER_CHARS = 600;

// GET is a convenience so the scoring run can be triggered from a browser
// (single-user admin tool). POST is the real programmatic trigger.
export async function GET() {
  return run();
}
export async function POST() {
  return run();
}

async function run() {
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "OpenAI is not configured (missing openai_api_key / OPENAI_API_KEY).", configured: false },
      { status: 400 }
    );
  }

  // Metered heavy AI action — enforce the plan's monthly cap (owner = unlimited).
  if (!(await aiActionAllowed())) {
    return NextResponse.json(AI_LIMIT_BODY, { status: 402 });
  }

  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "no master plan" }, { status: 500 });

  const supabase = createServerClient();

  const { data } = await supabase
    .from("unified_client_responses")
    .select("assessment_type, section_name, question_text, answer_text, answer_value, answered_at")
    .eq("master_plan_id", planId)
    .in("assessment_type", ["soul", "brain"]);

  const rows = (data ?? []) as Row[];
  // Drop flagged-sensitive answers entirely before scoring.
  const usable = rows.filter((r) => !(r.answer_value && r.answer_value.sensitive === true));

  // Index answers by "${assessment_type}:${section}".
  const bySection = new Map<string, ProseAnswer[]>();
  let latestAt: string | null = null;
  for (const r of usable) {
    const text = (r.answer_text ?? String(r.answer_value?.value ?? "")).trim();
    if (!r.section_name || !text) continue;
    const k = `${r.assessment_type}:${r.section_name}`;
    const arr = bySection.get(k) ?? [];
    arr.push({ question: r.question_text, answer: text.slice(0, MAX_ANSWER_CHARS) });
    bySection.set(k, arr);
    if (r.answered_at && (!latestAt || new Date(r.answered_at) > new Date(latestAt))) {
      latestAt = r.answered_at;
    }
  }

  const at = latestAt ?? new Date().toISOString();
  const aiScores: Record<string, { score: number; rationale: string; answeredAt: string }> = {};

  // Score every AI source (Soul or Brain) of every dimension from its sections.
  for (const def of DIMENSION_MODEL) {
    for (const source of def.sources) {
      if (source.method !== "ai") continue;
      const sections = source.kind === "soul" ? source.soulSections : source.brainSections;
      if (!sections?.length) continue;
      const answers: ProseAnswer[] = [];
      for (const sec of sections) {
        answers.push(...(bySection.get(`${source.kind}:${sec}`) ?? []));
      }
      if (answers.length === 0) continue;
      const result = await scoreDimensionFromProse(
        def.key as DimensionKey,
        def.label,
        answers.slice(0, MAX_ANSWERS_PER_SOURCE)
      );
      if (result) {
        aiScores[`${def.key}:${source.kind}`] = {
          score: result.score,
          rationale: result.rationale,
          answeredAt: at,
        };
      }
    }
  }

  // Merge into existing metadata (preserve anything else there).
  const { data: mp } = await supabase
    .from("client_master_plans")
    .select("metadata")
    .eq("id", planId)
    .maybeSingle();
  const metadata = { ...((mp?.metadata as Record<string, unknown>) ?? {}), ai_scores: aiScores };

  const soulScores = Object.entries(aiScores).filter(([k]) => k.endsWith(":soul")).map(([, v]) => v);

  const { error: upErr } = await supabase
    .from("client_master_plans")
    .update({ metadata, soul_score: overallOf(soulScores), updated_at: new Date().toISOString() })
    .eq("id", planId);

  if (upErr) {
    console.error("recompute update:", upErr.message);
    return NextResponse.json({ error: "failed to store ai scores" }, { status: 500 });
  }

  // Mirror the AI-computed dimension scores into segment_dimensions so the
  // Segments view reflects the AI. Coach overrides (updated_by='coach') are
  // preserved; everything else is refreshed from the AI.
  let segmentsSynced = 0;
  let snapshot: { type: string } | null = null;
  try {
    const computed = await gatherAndCompute(planId);
    segmentsSynced = await syncSegments(supabase, computed.domains);
    // Record a dated score point (first one becomes the baseline).
    snapshot = await captureSnapshot(supabase, planId, computed.domains, computed.overall);
  } catch (e) {
    console.error("recompute segment sync / snapshot:", e);
  }

  await recordAiAction(); // count this re-score against the monthly cap

  return NextResponse.json({
    ok: true,
    scoredSources: Object.keys(aiScores).length,
    segmentsSynced,
    snapshot,
    aiScores,
    usableAnswers: usable.length,
    droppedSensitive: rows.length - usable.length,
  });
}

function healthFor(score: number): "healthy" | "attention" | "at_risk" {
  if (score < 60) return "at_risk";
  if (score < 80) return "attention";
  return "healthy";
}

// Writes the AI-computed 12-domain scores into every segment's dimensions,
// leaving coach-overridden rows untouched. Returns rows written.
async function syncSegments(
  supabase: ReturnType<typeof createServerClient>,
  domains: Array<{ key: string; score: number | null }>
): Promise<number> {
  const { data: segs } = await supabase.from("segments").select("id");
  const segIds = (segs ?? []).map((s: { id: number }) => s.id);
  if (segIds.length === 0) return 0;

  const scored = domains.filter((d) => d.score !== null) as Array<{ key: string; score: number }>;

  const { data: existing } = await supabase
    .from("segment_dimensions")
    .select("segment_id, dimension_key, updated_by");
  const coach = new Set(
    ((existing ?? []) as Array<{ segment_id: number; dimension_key: string; updated_by: string | null }>)
      .filter((r) => r.updated_by === "coach")
      .map((r) => `${r.segment_id}:${r.dimension_key}`)
  );

  let written = 0;
  for (const segId of segIds) {
    // Clear this segment's non-coach rows, then write fresh AI values.
    await supabase
      .from("segment_dimensions")
      .delete()
      .eq("segment_id", segId)
      .or("updated_by.is.null,updated_by.neq.coach");
    const rows = scored
      .filter((d) => !coach.has(`${segId}:${d.key}`))
      .map((d) => ({
        segment_id: segId,
        dimension_key: d.key,
        score: d.score,
        health: healthFor(d.score),
        updated_by: "ai",
      }));
    if (rows.length) {
      await supabase.from("segment_dimensions").insert(rows);
      written += rows.length;
    }
  }
  return written;
}

function overallOf(scores: Array<{ score: number }>): number | null {
  const vals = scores.map((s) => s.score);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
