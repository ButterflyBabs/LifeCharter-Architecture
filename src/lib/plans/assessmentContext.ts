import { createServerClient } from "@/lib/supabase/server";
import { gatherAndCompute } from "@/lib/scoring/gather";

export interface AssessmentContext {
  overall: number | null;
  scores: { key: string; label: string; score: number }[];
  weakest: string[];
  strongest: string[];
  evidence: { section: string; text: string }[]; // Brain/Soul prose (sensitive dropped)
}

// Pulls the client's dimension scores + Brain/Soul prose evidence so the AI can
// ground plan drafting, reviews, and proposals in who they actually are. Sensitive
// Soul answers are never included.
export async function getAssessmentContext(masterPlanId: string, evidenceLimit = 40): Promise<AssessmentContext> {
  const supabase = createServerClient();

  let overall: number | null = null;
  const scores: { key: string; label: string; score: number }[] = [];
  try {
    const out = await gatherAndCompute(masterPlanId);
    overall = out.overall;
    for (const d of out.domains || []) {
      if (d.score !== null) scores.push({ key: d.key, label: d.label, score: Math.round(d.score) });
    }
  } catch {
    /* scoring optional */
  }
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const weakest = sorted.slice(0, 3).map((s) => s.label);
  const strongest = sorted.slice(-3).reverse().map((s) => s.label);

  const evidence: { section: string; text: string }[] = [];
  try {
    const { data } = await supabase
      .from("unified_client_responses")
      .select("section_name, answer_text, answer_value")
      .eq("master_plan_id", masterPlanId)
      .in("assessment_type", ["brain", "soul"])
      .limit(400);
    for (const r of (data || []) as { section_name: string | null; answer_text: string | null; answer_value: unknown }[]) {
      const av = r.answer_value as { sensitive?: boolean } | null;
      if (av && av.sensitive === true) continue;
      const text = (r.answer_text || "").trim();
      if (!text) continue;
      evidence.push({ section: r.section_name || "", text: text.slice(0, 400) });
      if (evidence.length >= evidenceLimit) break;
    }
  } catch {
    /* evidence optional */
  }

  return { overall, scores, weakest, strongest, evidence };
}

// Compact text block for an AI system/user prompt.
export function contextToText(ctx: AssessmentContext): string {
  const parts: string[] = [];
  if (ctx.overall !== null) parts.push(`Overall alignment: ${ctx.overall}/100.`);
  if (ctx.scores.length)
    parts.push(`Dimension scores: ${ctx.scores.map((s) => `${s.label} ${s.score}`).join(", ")}.`);
  if (ctx.weakest.length) parts.push(`Weakest areas: ${ctx.weakest.join(", ")}.`);
  if (ctx.strongest.length) parts.push(`Strongest areas: ${ctx.strongest.join(", ")}.`);
  if (ctx.evidence.length) {
    parts.push(
      "Founder's own words from assessments:\n" +
        ctx.evidence.map((e) => `- (${e.section}) ${e.text}`).join("\n")
    );
  }
  return parts.join("\n");
}
