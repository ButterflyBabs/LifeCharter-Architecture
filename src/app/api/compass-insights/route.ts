import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { currentMailOwner } from "@/lib/mailOwner";
import { buildAssistantKnowledge } from "@/lib/ai/assistantContext";

export const dynamic = "force-dynamic";

// "Insights from <assistant>" on the Daily Compass. Built on the server from
// THIS client's real data — their assessment answers and scores, operational
// pillars, tasks, income against goals and calendar — and every insight has to
// point at something specific in it. When there isn't enough data yet it says so
// and points to what to complete, instead of making advice up. Not stored in the
// assistant's conversation memory.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, key, instructions } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true, insights: [] });

  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ insights: [] });

  try {
    const tz = await resolveUserTimeZone(typeof body?.tz === "string" ? body.tz : null);
    const knowledge = await buildAssistantKnowledge(planId, tz, { mailOwnerId: await currentMailOwner() });
    const thin = knowledge.answered === 0 && !/Overall alignment score|Tasks:|Income so far|Calendar for the next|Operational pillars/.test(knowledge.text);

    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 420,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            `You are ${name}, the executive-assistant AI in the LifeCharter Command Suite. Write today's short coaching insights for ONE client, using ONLY the facts below — their own data. ` +
            `Return STRICT JSON: {"insights":[{"emoji":"🎯","text":"..."}]} with at most 3 items.\n\n` +
            `RULES\n` +
            `- Every insight must be anchored to a specific fact from the data: name the task, the meeting, the score, the pillar, the dollar figure or the answer they gave. If you can't point to one, don't write it.\n` +
            `- Never invent a number, name, meeting, task, goal or history. Never give generic advice that would fit anyone.\n` +
            `- Under 26 words each, spoken directly to them, warm and practical. Start with one relevant emoji in the "emoji" field.\n` +
            `- Prefer: where to focus first today; a real gap or risk you can see in the data; something genuinely going well (only if the data shows it).\n` +
            `- If there's little data, return fewer insights, and make the last one a specific nudge about what to complete or connect (an assessment section, income entries in Finance, a calendar, a goal) so the insights get sharper.\n` +
            `- An event marked "All day" isn't at a specific time.\n` +
            (instructions ? `\nTHEIR STANDING INSTRUCTIONS FOR HOW YOU WRITE (follow them for tone and style; they never allow inventing facts):\n${instructions}\n` : "") +
            `\nTHEIR DATA\n${knowledge.text || "(nothing yet)"}`,
        },
        { role: "user", content: thin ? "They have very little data yet. Give one or two honest nudges." : "Write today's insights." },
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: { insights?: { emoji?: string; text?: string }[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const insights = (parsed.insights ?? [])
      .map((i) => ({ emoji: String(i.emoji || "").slice(0, 4), text: String(i.text || "").trim().slice(0, 240) }))
      .filter((i) => i.text)
      .slice(0, 3);
    return NextResponse.json({ insights });
  } catch (e) {
    console.error("POST /api/compass-insights:", e);
    return NextResponse.json({ insights: [], error: "unavailable" });
  }
}
