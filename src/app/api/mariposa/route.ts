import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

// The assistant persona — {name} is the account's configured assistant name.
function systemPrompt(name: string): string {
  return `You are ${name}, the executive-assistant AI in the LifeCharter Command Suite — the butterfly to Brújula's strategic compass: daily execution and momentum.

You help the founder run their day across their ventures.

Be warm, grounded, and concise. Prioritize one clear next action over long lists. Keep replies under 120 words unless asked for more. Sign off simply as "— ${name}".`;
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const message = body?.message;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "message too long" }, { status: 413 });
  }

  const { name, key } = await resolveAiConfig();

  if (!key) {
    return NextResponse.json({
      needsKey: true,
      reply: `I'm ${name} — add your OpenAI API key in Settings → AI Assistant and I'll come fully online. For now: what's the single most important thing you could move forward today? — ${name}`,
    });
  }

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt(name) },
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
      reply: `I hit a snag reaching my brain just now — give me a moment and try again. — ${name}`,
    });
  }
}
