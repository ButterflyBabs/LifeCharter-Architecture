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

const CONFLICT = "master_plan_id,assessment_type,question_id";

// An upsert refuses a batch that names the same question twice; keep the last answer given for each.
function lastPerQuestion<T extends { question_id: string }>(rows: T[]): T[] {
  return Array.from(new Map(rows.map((r) => [r.question_id, r] as const)).values());
}

// The saved answers of one assessment for the signed-in account (or the client being viewed read-only),
// so an assessment opened on another device or browser picks up where it was left off.
//   GET ?type=brain|soul|profit_architecture|quick_pulse → { responses: [{ questionId, value, answerText, sensitive }] }
export async function GET(request: Request) {
  try {
    const type = new URL(request.url).searchParams.get("type") || "";
    if (!ALLOWED_TYPES.has(type)) return NextResponse.json({ error: "invalid or missing type" }, { status: 400 });
    const planId = await resolveMasterPlanId();
    if (!planId) return NextResponse.json({ responses: [] });
    const { data, error } = await createServerClient()
      .from("unified_client_responses")
      .select("question_id, answer_value, answer_text")
      .eq("master_plan_id", planId)
      .eq("assessment_type", type)
      .limit(2000);
    if (error) {
      console.error("GET /api/assessments/save:", error.message);
      return NextResponse.json({ error: "failed to load responses" }, { status: 500 });
    }
    const responses = ((data ?? []) as { question_id: string; answer_value: unknown; answer_text: string | null }[]).map((r) => {
      const av = r.answer_value as { value?: unknown; sensitive?: unknown } | string | null;
      const value = av && typeof av === "object" ? av.value : av;
      return {
        questionId: r.question_id,
        value: typeof value === "string" ? value : value == null ? "" : String(value),
        answerText: r.answer_text ?? "",
        sensitive: Boolean(av && typeof av === "object" && av.sensitive),
      };
    });
    return NextResponse.json({ responses }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("GET /api/assessments/save:", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = String(body?.type ?? "");
    const responses: IncomingResponse[] = Array.isArray(body?.responses) ? body.responses : [];

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "invalid or missing type" }, { status: 400 });
    }
    const partial = body?.partial === true;
    const removedIds: string[] = Array.isArray(body?.removedIds) ? body.removedIds.map(String).slice(0, 1000) : [];
    if (responses.length === 0 && !(partial && removedIds.length > 0)) {
      return NextResponse.json({ error: "no responses to save" }, { status: 400 });
    }

    const planId = await resolveMasterPlanId();
    if (!planId) {
      return NextResponse.json({ error: "could not resolve master plan" }, { status: 500 });
    }

    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Progressive save: as each answer is given (or cleared) the assessment
    // pages send just what changed, so the client's AI assistant learns from
    // every answer without waiting for the assessment to be finished. Only the
    // named questions are replaced; everything else stays. No re-scoring here —
    // that still runs once, when the assessment is completed.
    if (partial) {
      const toRow = (r: IncomingResponse) => ({
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
      });
      const changed = lastPerQuestion(responses.filter((r) => r.questionId && r.questionText).slice(0, 1000).map(toRow));
      // Safe order: write the changed answers FIRST (an upsert, so a failure leaves every earlier answer in
      // place), then remove only the answers the client explicitly cleared.
      for (let i = 0; i < changed.length; i += 200) {
        const { error } = await supabase.from("unified_client_responses").upsert(changed.slice(i, i + 200), { onConflict: CONFLICT });
        if (error) {
          console.error("POST /api/assessments/save partial upsert:", error.message);
          return NextResponse.json({ error: "failed to save responses" }, { status: 500 });
        }
      }
      const changedIds = new Set(changed.map((r) => r.question_id));
      const cleared = removedIds.filter((id) => !changedIds.has(id));
      for (let i = 0; i < cleared.length; i += 200) {
        await supabase
          .from("unified_client_responses")
          .delete()
          .eq("master_plan_id", planId)
          .eq("assessment_type", type)
          .in("question_id", cleared.slice(i, i + 200));
      }
      return NextResponse.json({ ok: true, partial: true, saved: changed.length, removed: removedIds.length });
    }

    const rows = lastPerQuestion(responses
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
      })));

    if (rows.length === 0) {
      return NextResponse.json({ error: "no valid responses" }, { status: 400 });
    }

    // Safe order for a clean re-take: write the new answers first (upsert, in chunks: Brain can be 500+ rows),
    // and only when every chunk is saved remove the old answers that are no longer part of this set. A failed
    // write can therefore never leave the client with fewer answers than before.
    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase.from("unified_client_responses").upsert(rows.slice(i, i + CHUNK), { onConflict: CONFLICT });
      if (error) {
        console.error("POST /api/assessments/save upsert:", error.message);
        return NextResponse.json({ error: "failed to save responses" }, { status: 500 });
      }
    }
    const keep = new Set(rows.map((r) => r.question_id));
    const { data: existing } = await supabase
      .from("unified_client_responses")
      .select("question_id")
      .eq("master_plan_id", planId)
      .eq("assessment_type", type)
      .limit(5000);
    const stale = ((existing ?? []) as { question_id: string }[]).map((r) => r.question_id).filter((id) => !keep.has(id));
    for (let i = 0; i < stale.length; i += 200) {
      await supabase
        .from("unified_client_responses")
        .delete()
        .eq("master_plan_id", planId)
        .eq("assessment_type", type)
        .in("question_id", stale.slice(i, i + 200));
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
