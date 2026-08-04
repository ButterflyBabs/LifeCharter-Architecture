import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";
import { PLATFORM_LABELS } from "@/lib/postStream";

export const dynamic = "force-dynamic";

// Drafts a social caption (and optional hashtags) for Create Content, using the
// client's own AI bot. Grounded by the platforms selected and an idea/prompt.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  if (!idea) return NextResponse.json({ error: "Tell me what the post is about." }, { status: 400 });

  const platforms = Array.isArray(body.platforms) ? body.platforms.map(String) : [];
  const tone = typeof body.tone === "string" ? body.tone.trim() : "warm, authentic, on-brand";

  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const platformText = platforms.length
    ? platforms.map((p: string) => PLATFORM_LABELS[p] || p).join(", ")
    : "social media";

  const sys =
    `You are ${name}, a social media copywriter for a small business owner. ` +
    `Write a caption for ${platformText}. Match this tone: ${tone}. ` +
    "Keep it native to the platform(s) — punchy for X, warmer for Instagram/Facebook, professional for LinkedIn. " +
    'Return STRICT JSON: {"caption":"the caption text with line breaks","hashtags":["#tag","..."]}. ' +
    "5-8 relevant hashtags. Do not include the hashtags inside the caption field.";

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Post idea: ${idea}` },
      ],
      max_tokens: 500,
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
    });
  } catch (e) {
    console.error("POST /api/content/ai-caption:", e);
    return NextResponse.json({ error: "Couldn't draft a caption — try again." }, { status: 502 });
  }
}
