import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { buildAssistantKnowledge, loadHistory, saveTurn, clearHistory, assistantSystemPrompt } from "@/lib/ai/assistantContext";

export const dynamic = "force-dynamic";

// The assistant persona — {name} is the account's configured assistant name.
function persona(name: string): string {
  return `You are ${name}, the executive-assistant AI in the LifeCharter Command Suite — the butterfly to Brújula's strategic compass: daily execution and momentum.

You help the founder run their day across their ventures.

Be warm, grounded, and concise. Prioritize one clear next action over long lists. Keep replies under 130 words unless asked for more.`;
}

// Ask the assistant. It answers from THIS client's own assessments, live scores
// and today's tasks, and remembers the conversation so far.
// Body: { message, page? } — page is the section of the app they're on.
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
  const page = typeof body?.page === "string" ? body.page.slice(0, 60) : "";

  const { name, key } = await resolveAiConfig();

  if (!key) {
    return NextResponse.json({
      needsKey: true,
      reply: `I'm ${name} — add your OpenAI API key in Settings → AI Assistant and I'll come fully online. For now: what's the single most important thing you could move forward today? — ${name}`,
    });
  }

  try {
    const planId = await resolveMasterPlanId();
    const tz = await resolveUserTimeZone(typeof body?.tz === "string" ? body.tz : null);
    const [knowledge, history] = planId
      ? await Promise.all([buildAssistantKnowledge(planId, tz), loadHistory(planId)])
      : [{ text: "", answered: 0 }, []];

    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: assistantSystemPrompt(name, persona(name), knowledge, page ? `\nThey are currently on the "${page}" part of the app.` : ""),
        },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: 420,
      temperature: 0.6,
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    if (planId && reply) await saveTurn(planId, "mariposa", message, reply).catch((e) => console.error("saveTurn:", e));
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("POST /api/mariposa:", e);
    return NextResponse.json({
      reply: `I hit a snag reaching my brain just now — give me a moment and try again. — ${name}`,
    });
  }
}

// Forget the conversation so far (the assessments themselves are untouched).
export async function DELETE(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await clearHistory(planId);
  return NextResponse.json({ ok: true });
}
