import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";

export const dynamic = "force-dynamic";

// Persists a completed assessment's answers to unified_client_responses under
// the single-user master plan. Service role — not auth-gated — so it works in
// the current auth-off app (unlike the older /api/unified-memory/* routes).
//
// Body: { type: "soul" | "brain", responses: [{ questionId, questionText,
//         section, answerText, value, sensitive?, score?, maxScore? }] }
//
// `sensitive` is preserved into answer_value so the Phase-2 AI scoring layer can
// exclude flagged answers from all automated scoring and generation.

type IncomingResponse = {
  questionId: string;
  questionText: string;
  section?: string;
  answerText?: string;
  value?: unknown;
  sensitive?: boolean;
  score?: number | null;
  maxScore?: number | null;
};

const ALLOWED_TYPES = new Set(["soul", "brain", "profit_architecture", "quick_pulse"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = String(body?.type ?? "");
    const responses: IncomingResponse[] = Array.isArray(body?.responses) ? body.responses : [];

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "invalid or missing type" }, { status: 400 });
    }
    if (responses.length === 0) {
      return NextResponse.json({ error: "no responses to save" }, { status: 400 });
    }

    const planId = await resolveMasterPlanId();
    if (!planId) {
      return NextResponse.json({ error: "could not resolve master plan" }, { status: 500 });
    }

    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Replace any prior answers for this assessment type (clean re-take).
    await supabase
      .from("unified_client_responses")
      .delete()
      .eq("master_plan_id", planId)
      .eq("assessment_type", type);

    const rows = responses
      .filter((r) => r.questionId && r.questionText)
      .map((r) => ({
        master_plan_id: planId,
        assessment_type: type,
        question_id: r.questionId,
        question_text: r.questionText,
        section_name: r.section ?? null,
        answer_value: { value: r.value ?? r.answerText ?? "", sensitive: Boolean(r.sensitive) },
        answer_text: typeof r.answerText === "string" ? r.answerText : null,
        score: typeof r.score === "number" ? r.score : null,
        max_score: typeof r.maxScore === "number" ? r.maxScore : null,
        answered_at: now,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "no valid responses" }, { status: 400 });
    }

    // Insert in chunks — Brain can be 500+ rows.
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase.from("unified_client_responses").insert(rows.slice(i, i + CHUNK));
      if (error) {
        console.error("POST /api/assessments/save insert:", error.message);
        return NextResponse.json({ error: "failed to save responses" }, { status: 500 });
      }
    }

    await supabase
      .from("client_master_plans")
      .update({ last_assessment_at: now, updated_at: now })
      .eq("id", planId);

    return NextResponse.json({ ok: true, masterPlanId: planId, saved: rows.length });
  } catch (e) {
    console.error("POST /api/assessments/save:", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
