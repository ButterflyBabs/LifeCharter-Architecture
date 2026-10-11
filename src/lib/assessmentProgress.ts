import type { SupabaseClient } from "@supabase/supabase-js";

// Where an account is in each of the three assessments (Brain, Soul, Profit). One definition for everything that
// asks "are the assessments done?": the setup checklist, the Next Chapter Call invitation, the coach review task and
// the New Client Journey page.
//   complete    = the client pressed Complete on it (assessment_completions), or for Profit its scores are saved
//   in_progress = some answers are saved, not finished
//   not_started = nothing saved
// Answers are saved as they are given (progress), so "has an answer" must never be read as "finished".
export type AssessmentKey = "brain" | "soul" | "profit";
export type AssessmentStatus = "not_started" | "in_progress" | "complete";
export interface AssessmentState { status: AssessmentStatus; answered: number; lastAnsweredAt: string | null; completedAt: string | null }
export interface AssessmentProgress { brain: AssessmentState; soul: AssessmentState; profit: AssessmentState; allComplete: boolean; lastActivityAt: string | null }

// What a full set of answers looks like (the owner's own completed assessments), to show "about N%" while in progress.
export const APPROX_TOTAL: Record<AssessmentKey, number> = { brain: 535, soul: 261, profit: 60 };

const TYPE_OF: Record<AssessmentKey, string> = { brain: "brain", soul: "soul", profit: "profit_architecture" };

export async function assessmentProgress(db: SupabaseClient, planId: string): Promise<AssessmentProgress> {
  const [{ data: done }, { data: plan }, ...answers] = await Promise.all([
    db.from("assessment_completions").select("assessment_type, completed_at").eq("master_plan_id", planId),
    db.from("client_master_plans").select("domain_scores, profit_score, last_assessment_at").eq("id", planId).maybeSingle(),
    ...(["brain", "soul", "profit"] as AssessmentKey[]).map(async (k) => {
      const [{ count }, { data: last }] = await Promise.all([
        db.from("unified_client_responses").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("assessment_type", TYPE_OF[k]),
        db.from("unified_client_responses").select("answered_at").eq("master_plan_id", planId).eq("assessment_type", TYPE_OF[k]).order("answered_at", { ascending: false }).limit(1),
      ]);
      return { k, count: count ?? 0, last: ((last ?? [])[0]?.answered_at as string | undefined) ?? null };
    }),
  ]);
  const completed = new Map(((done ?? []) as { assessment_type: string; completed_at: string }[]).map((r) => [r.assessment_type, r.completed_at]));
  const ds = (plan?.domain_scores as Record<string, unknown> | null) || null;
  const profitSaved = Boolean((ds && typeof ds === "object" && Object.keys(ds).length) || plan?.profit_score);
  const byKey = new Map(answers.map((a) => [a.k, a]));
  const build = (k: AssessmentKey): AssessmentState => {
    const a = byKey.get(k)!;
    const completedAt = completed.get(k) ?? (k === "profit" && profitSaved ? ((plan?.last_assessment_at as string | null) ?? new Date(0).toISOString()) : null);
    return { status: completedAt ? "complete" : a.count > 0 ? "in_progress" : "not_started", answered: a.count, lastAnsweredAt: a.last, completedAt };
  };
  const out = { brain: build("brain"), soul: build("soul"), profit: build("profit") };
  const times = [out.brain.lastAnsweredAt, out.soul.lastAnsweredAt, out.profit.lastAnsweredAt].filter(Boolean) as string[];
  return { ...out, allComplete: out.brain.status === "complete" && out.soul.status === "complete" && out.profit.status === "complete", lastActivityAt: times.sort().slice(-1)[0] ?? null };
}

export async function recordCompletion(db: SupabaseClient, planId: string, key: AssessmentKey, answers?: number) {
  await db.from("assessment_completions").upsert({ master_plan_id: planId, assessment_type: key, completed_at: new Date().toISOString(), answers_at_completion: answers ?? null }, { onConflict: "master_plan_id,assessment_type" });
}
