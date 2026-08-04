import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";
import { gatherAndCompute } from "@/lib/scoring/gather";

export const dynamic = "force-dynamic";

// AI for Quick Wins. Two modes:
//   generate — propose a fresh quick win tailored to the client's weakest
//              business dimensions (or an optional focus they type in).
//   improve  — rewrite the wording of a quick win the client is editing.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const mode = body.mode === "improve" ? "improve" : "generate";

  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  let sys = "";
  let userText = "";

  if (mode === "improve") {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Nothing to improve." }, { status: 400 });
    sys =
      `You are ${name}, a sharp, supportive business coach. ` +
      "Rewrite this quick-win action so it's crisp, specific, and doable today. " +
      'Return STRICT JSON: {"title":"short action, <=70 chars","detail":"one motivating sentence, <=90 chars",' +
      '"emoji":"one relevant emoji","priority":"high|medium|low"}. Keep the intent; sharpen the wording.';
    userText = `Current title: ${title}\nCurrent detail: ${typeof body.detail === "string" ? body.detail : ""}`;
  } else {
    // Ground a fresh suggestion in the client's weakest dimensions.
    let focusLine = "";
    try {
      const out = await gatherAndCompute(null);
      const scored = (out.domains || []).filter((d) => d.score !== null) as { label: string; score: number }[];
      const weakest = [...scored].sort((a, b) => a.score - b.score).slice(0, 3).map((d) => d.label);
      if (weakest.length) focusLine = `Their weakest business areas right now: ${weakest.join(", ")}. `;
    } catch {
      /* grounding is best-effort */
    }
    const askedFocus = typeof body.focus === "string" ? body.focus.trim() : "";
    const avoid = Array.isArray(body.existing)
      ? (body.existing as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 20)
      : [];

    sys =
      `You are ${name}, a sharp, supportive business coach. ` +
      "Suggest ONE small, high-leverage 'quick win' the owner can do today in under 30 minutes to move their business forward. " +
      'Return STRICT JSON: {"title":"short action, <=70 chars","detail":"one motivating sentence, <=90 chars",' +
      '"emoji":"one relevant emoji","priority":"high|medium|low"}. ' +
      "Make it concrete and immediately actionable — not vague advice. Do not repeat any action in the avoid-list.";
    userText =
      `${focusLine}` +
      (askedFocus ? `The owner wants a quick win focused on: ${askedFocus}. ` : "") +
      (avoid.length ? `Avoid duplicating these: ${avoid.join("; ")}.` : "Give something fresh and useful.");
  }

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userText },
      ],
      max_tokens: 300,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const priority = ["high", "medium", "low"].includes(String(parsed.priority)) ? String(parsed.priority) : "medium";
    const title = String(parsed.title || "").trim();
    if (!title) return NextResponse.json({ error: "Couldn't come up with one — try again." }, { status: 502 });
    return NextResponse.json({
      win: {
        title: title.slice(0, 120),
        detail: String(parsed.detail || "").trim().slice(0, 160),
        emoji: String(parsed.emoji || "⚡").trim().slice(0, 4) || "⚡",
        priority,
      },
    });
  } catch (e) {
    console.error("POST /api/quick-wins/ai:", e);
    return NextResponse.json({ error: "Couldn't reach the AI just now — try again." }, { status: 502 });
  }
}
