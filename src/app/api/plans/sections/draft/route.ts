import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { getBlueprint } from "@/lib/plans/blueprints";
import { getAssessmentContext, contextToText } from "@/lib/plans/assessmentContext";

export const dynamic = "force-dynamic";

// AI-drafts one plan section, grounded in the client's assessments, scores, the
// section's guiding questions + any answers, and the other sections already written.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "";
  const sectionKey = typeof body.sectionKey === "string" ? body.sectionKey : "";
  const bp = getBlueprint(type);
  const section = bp?.sections.find((s) => s.key === sectionKey);
  if (!bp || !section) return NextResponse.json({ error: "unknown section" }, { status: 400 });

  const masterPlanId = await resolveMasterPlanId();
  if (!masterPlanId) return NextResponse.json({ error: "no workspace" }, { status: 400 });

  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const ctx = await getAssessmentContext(masterPlanId);

  // Other sections already written, for coherence.
  const supabase = createServerClient();
  const { data: others } = await supabase
    .from("plan_sections")
    .select("section_key, content")
    .eq("master_plan_id", masterPlanId)
    .eq("plan_type", type);
  const otherText = ((others || []) as { section_key: string; content: string | null }[])
    .filter((o) => o.section_key !== sectionKey && (o.content || "").trim())
    .map((o) => {
      const t = bp.sections.find((s) => s.key === o.section_key)?.title || o.section_key;
      return `## ${t}\n${(o.content || "").slice(0, 500)}`;
    })
    .join("\n\n");

  // The owner's own answers to the guiding questions (optional).
  const answers = body.answers && typeof body.answers === "object" ? (body.answers as Record<string, string>) : {};
  const answerText = section.guiding
    .map((q, i) => (answers[String(i)] ? `Q: ${q}\nA: ${answers[String(i)]}` : ""))
    .filter(Boolean)
    .join("\n");

  const sys =
    `You are ${name}, a seasoned business strategist helping a founder build a legacy business — ` +
    "not a bare-minimum operation. Write ONE section of their " +
    `${bp.label}: "${section.title}". ${section.description} ` +
    "Ground it in the founder's real assessment evidence and scores below — reflect their actual voice, market, and situation; never generic filler. " +
    "Be practical and specific: concrete, usable, and honest about where they are. Where you make an assumption, phrase it so they can confirm or correct. " +
    "Return STRICT JSON: {\"content\":\"the section, in clear prose with short paragraphs or bullet lines\"}. " +
    "Aim for 120–250 words — substantial but not padded.";

  const userText =
    `${bp.label} — section: ${section.title}\n` +
    `What this section captures: ${section.description}\n` +
    `Draw especially on: ${section.assess}\n\n` +
    (answerText ? `The founder's answers to the guiding questions:\n${answerText}\n\n` : "") +
    `--- ASSESSMENT CONTEXT ---\n${contextToText(ctx)}\n\n` +
    (otherText ? `--- OTHER SECTIONS ALREADY WRITTEN ---\n${otherText}\n` : "");

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userText },
      ],
      max_tokens: 700,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: { content?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const content = String(parsed.content || "").trim();
    if (!content) return NextResponse.json({ error: "Couldn't draft that — add a guiding answer and retry." }, { status: 502 });
    return NextResponse.json({ content });
  } catch (e) {
    console.error("POST /api/plans/sections/draft:", e);
    return NextResponse.json({ error: "Couldn't reach the AI just now — try again." }, { status: 502 });
  }
}
