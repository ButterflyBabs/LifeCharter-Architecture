import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { planningAssistant } from "@/lib/ai/planningAi";
import { answersText, type DeeperAnswers } from "@/lib/operationsDeeper";
import { gatherAndCompute } from "@/lib/scoring/gather";
import { latestInsight, saveInsight } from "@/lib/ai/planKnowledge";
import { memberAiGate } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";

// The last insights this client's assistant gave (so the page shows them on load).
export async function GET() {
  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ saved: null });
  const i = await latestInsight(masterPlanId, "operations").catch(() => null);
  return NextResponse.json({ saved: i ? { ...i.content, createdAt: i.createdAt } : null });
}

// AI insights for the 8 operational pillars: reads each pillar's saved status +
// notes and asks the client's bot where to focus next. Structured JSON so the
// page can render readable, high-contrast cards.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();

  const { data } = await supabase
    .from("operations_pillars")
    .select("pillar_key, notes, answers")
    .eq("master_plan_id", masterPlanId);
  const saved = new Map(
    ((data || []) as { pillar_key: string; notes: string | null; answers: DeeperAnswers | null }[]).map((r) => [r.pillar_key, r])
  );

  const scored = masterPlanId ? await gatherAndCompute(masterPlanId).catch(() => null) : null;
  const rows = (scored?.pillars ?? []).map((p) => {
    const s = saved.get(p.key);
    return {
      name: p.name,
      score: p.score,
      phase: p.phase,
      weakest: p.sources
        .filter((x) => x.subScore !== null)
        .sort((x, y) => (x.subScore as number) - (y.subScore as number))
        .slice(0, 2)
        .map((x) => `${x.label} ${x.subScore}`)
        .join("; "),
      notes: (s?.notes || "").trim(),
      deeper: answersText(p.key, s?.answers),
    };
  });

  // Their own assistant, knowing everything about their business (assessment
  // answers, scores, plans, tasks, SOPs…), not just the pillar ratings.
  const a = await planningAssistant();
  if (!a?.key) return NextResponse.json({ needsKey: true });
  const overCap = await memberAiGate();
  if (overCap) return overCap;
  const { name, key } = a;

  const dataText = rows
    .map(
      (r) =>
        `${r.name}: ${r.score === null ? "not scored yet" : `${r.score}/100 (${r.phase})`}${r.weakest ? ` — lowest inputs: ${r.weakest}` : ""}${r.notes ? ` — notes: ${r.notes}` : ""}${r.deeper ? ` — their answers: ${r.deeper}` : ""}`
    )
    .join("\n");

  const sys =
    `You are ${name}, a sharp, supportive operations advisor for a small business owner. ` +
    (a.instructions ? `Their standing instructions for how you write: ${a.instructions}\n` : "") +
    `What you know about them (their own words and live numbers):\n${a.knowledge || "(nothing recorded yet)"}\n` +
    "You're looking at their 8 operational pillars. Each is SCORED 0-100 by the Suite from their assessments, check-ins, real activity and their answers to deeper questions (the client does not set it). " +
    "Assess overall operational health and tell them where to focus next. " +
    'Return STRICT JSON: {"headline":"1-sentence read on operational health",' +
    '"insights":[{"pillar":"pillar name","priority":"high|medium|low","detail":"what to do and why it matters"}]}. ' +
    "Prioritize the lowest-scoring pillars and ones not scored yet (suggest the Go deeper questions), and weigh their notes. " +
    "2-4 insights, most important first. Be specific and encouraging. Do not invent facts not in the data.";

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: dataText },
      ],
      max_tokens: 800,
      temperature: 0.4,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const result = {
      headline: String(parsed.headline || "").trim() || "Answer the Go deeper questions on a few pillars and I'll show you where to focus.",
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [],
    };
    // Saved so the page remembers them and the assistant knows what was advised.
    if (masterPlanId && result.insights.length) {
      await saveInsight(masterPlanId, "operations", name, { ...result, summary: result.headline }).catch(() => {});
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("POST /api/operations/insights:", e);
    return NextResponse.json({ error: "Couldn't generate insights — try again in a moment." }, { status: 502 });
  }
}
