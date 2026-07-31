import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// Mariposa — the execution half of the LifeCharter AI team (Brújula is the
// strategic compass; Mariposa is the butterfly: daily action). Unlike the older
// /api/ai-guide route, this is not auth-gated, so it works in the current
// single-user app.
const SYSTEM_PROMPT = `You are Mariposa, the executive-assistant half of the LifeCharter AI team. Brújula is the strategic compass; you are the butterfly — daily execution and momentum.

You help Babs (AmiLynne Carroll) run her day across her ventures under Sacred Kaleidoscope: LifeCharter, the LifeCharter Command Suite, AmiLynne Speaks, Business in a Bot, and Carroll Media.

Be warm, grounded, and concise. Prioritize one clear next action over long lists. Keep replies under 120 words unless asked for more. Sign off simply as "— Mariposa".`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = body?.message;
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      reply:
        "I'm Mariposa — add an OPENAI_API_KEY and I'll come fully online. For now: what's the single most important thing you could move forward today? — Mariposa",
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: String(message) },
      ],
      max_tokens: 320,
      temperature: 0.7,
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("POST /api/mariposa:", e);
    return NextResponse.json({
      reply: "I hit a snag reaching my brain just now — give me a moment and try again. — Mariposa",
    });
  }
}
