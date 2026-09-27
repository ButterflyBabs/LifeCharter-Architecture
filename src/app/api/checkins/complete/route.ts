import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Saves a finished Quick Pulse check-in in one step, for the signed-in client's own account:
// the check-in (scores + all answers, kept as history), the latest answer to each question
// (for the assistant and scoring), and the suggested action steps. Replaces three separate
// browser writes that failed silently (wrong column, rejected labels, duplicate answers).

type Answer = { questionId: string; questionText?: string; value: string; section: string; dimension: string; text: string | null };
type Step = { title: string; description?: string; dimension?: string; priority?: string };

const CATEGORIES = new Set(["brain", "soul", "profit", "integration", "general"]);
const PRIORITIES = new Set(["critical", "high", "medium", "low"]);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "No account found." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const answers = (Array.isArray(body.answers) ? body.answers : []).slice(0, 100) as Answer[];
  const steps = (Array.isArray(body.steps) ? body.steps : []).slice(0, 20) as Step[];
  const s = body.scores ?? {};
  if (!answers.length) return NextResponse.json({ error: "No answers to save." }, { status: 400 });

  const supabase = createServerClient();
  const { data: plan } = await supabase.from("client_master_plans").select("workspace_id").eq("id", masterPlanId).maybeSingle();
  const workspaceId = (plan?.workspace_id as string) ?? null;
  const now = new Date().toISOString();

  const { data: checkin, error: checkinErr } = await supabase
    .from("quick_pulse_checkins")
    .insert({
      master_plan_id: masterPlanId,
      workspace_id: workspaceId,
      brain_score: num(s.brainScore),
      soul_score: num(s.soulScore),
      profit_score: num(s.profitScore),
      total_score: num(s.totalScore),
      health_level: typeof s.healthLevel === "string" ? s.healthLevel : null,
      responses: Object.fromEntries(answers.map((a) => [a.questionId, a.value])),
    })
    .select("id")
    .single();
  if (checkinErr) {
    console.error("quick pulse checkin:", checkinErr.message);
    return NextResponse.json({ error: "Couldn't save your check-in. Please try again." }, { status: 500 });
  }

  // Latest answer per question (every check-in's full set stays on the check-in row above).
  const { error: respErr } = await supabase.from("unified_client_responses").upsert(
    answers.map((a) => ({
      master_plan_id: masterPlanId,
      workspace_id: workspaceId,
      assessment_type: "quick_pulse",
      question_id: String(a.questionId),
      question_text: String(a.questionText || a.questionId).slice(0, 1000),
      section_name: a.section,
      section_type: a.dimension,
      answer_value: a.value,
      answer_text: a.text,
      score: Number.isFinite(parseInt(a.value, 10)) ? parseInt(a.value, 10) * 20 : null,
      answered_at: now,
      updated_at: now,
    })),
    { onConflict: "master_plan_id,assessment_type,question_id" }
  );
  if (respErr) console.error("quick pulse answers:", respErr.message);

  let stepsSaved = 0;
  if (steps.length) {
    const { error: stepErr, count } = await supabase.from("client_action_items").insert(
      steps.map((st) => ({
        master_plan_id: masterPlanId,
        workspace_id: workspaceId,
        title: String(st.title || "").slice(0, 200) || "Next step",
        description: st.description ? String(st.description).slice(0, 2000) : null,
        category: CATEGORIES.has(String(st.dimension)) ? st.dimension : "general",
        priority: PRIORITIES.has(String(st.priority)) ? st.priority : "medium",
        source_type: "quick_pulse",
        source_id: checkin.id,
        status: "pending",
      })),
      { count: "exact" }
    );
    if (stepErr) console.error("quick pulse steps:", stepErr.message);
    else stepsSaved = count ?? steps.length;
  }

  return NextResponse.json({ ok: true, checkinId: checkin.id, answersSaved: respErr ? 0 : answers.length, stepsSaved });
}
