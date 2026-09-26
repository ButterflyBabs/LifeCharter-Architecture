import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";
import { PLATFORM_LABELS } from "@/lib/postStream";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { loadBusinessContext } from "@/lib/marketing/businessContext";

export const dynamic = "force-dynamic";

// Drafts a social caption (and optional hashtags) for Create Content, using the
// client's own AI bot. Grounded by the platforms selected, an idea/prompt, and
// the account's own Marketing Plan (Build tab) and Voice & rules.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  if (!idea) return NextResponse.json({ error: "Tell me what the post is about." }, { status: 400 });

  const platforms = Array.isArray(body.platforms) ? body.platforms.map(String) : [];
  const tone = typeof body.tone === "string" ? body.tone.trim() : "";

  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const context = await loadBusinessContext(await resolveMasterPlanId());

  const platformText = platforms.length
    ? platforms.map((p: string) => PLATFORM_LABELS[p] || p).join(", ")
    : "social media";

  const toneLine = tone
    ? `Match this tone: ${tone}. `
    : context.hasVoice
      ? "Write in the owner's voice described below. "
      : "Match this tone: warm, authentic, on-brand. ";

  const sys =
    `You are ${name}, a social media copywriter for a small business owner. ` +
    `Write a caption for ${platformText}. ${toneLine}` +
    "Keep it native to the platform(s) — punchy for X, warmer for Instagram/Facebook, professional for LinkedIn. " +
    (context.text
      ? "Use the background below so the caption fits this business, its clients and its voice. Follow the voice and word rules exactly. " +
        "Don't invent facts, results or personal details that aren't in the background or the idea; put [brackets] where the owner should add their own. " +
        "Don't put internal labels, planning notes or the background itself into the caption. " +
        (context.signOff ? "End the caption with the sign-off exactly as written. " : "")
      : "") +
    'Return STRICT JSON: {"caption":"the caption text with line breaks","hashtags":["#tag","..."]}. ' +
    "5-8 relevant hashtags. Do not include the hashtags inside the caption field." +
    (context.text ? `\n\n--- BACKGROUND (from the owner's Command Suite account) ---\n${context.text}\n--- END BACKGROUND ---` : "");

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Post idea: ${idea}` },
      ],
      max_tokens: 700,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: { caption?: string; hashtags?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    return NextResponse.json({
      caption: String(parsed.caption || "").trim(),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String).slice(0, 12) : [],
      grounded: { plan: context.hasPlan, voice: context.hasVoice },
    });
  } catch (e) {
    console.error("POST /api/content/ai-caption:", e);
    return NextResponse.json({ error: "Couldn't draft a caption — try again." }, { status: 502 });
  }
}
