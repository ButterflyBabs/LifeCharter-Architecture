import { NextRequest, NextResponse } from "next/server";
import { aiClient } from "@/lib/ai/client";
import { resolveAiConfig } from "@/lib/ai/config";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { currentMailOwner } from "@/lib/mailOwner";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { buildAssistantKnowledge, loadHistory, saveTurn, assistantSystemPrompt } from "@/lib/ai/assistantContext";
import { memberAiGate } from "@/lib/ai/memberCap";
import { approvedHelpFor } from "@/lib/ai/helpSuggestions";
import { screenMessage, CRISIS_REPLY } from "@/lib/ai/redFlags";

// System prompt for the AI Business Guide ({name} = the account's assistant).
const systemPrompt = (name: string) => `You are ${name}, the AI business guide in the LifeCharter Command Suite, a business assessment and optimization platform.

Your role is to provide compassionate, practical, and strategic guidance to entrepreneurs and business owners based on their business scores across three dimensions:

1. **Brain (Systems & Operations)** - How well their business runs without them
2. **Soul (Purpose & Alignment)** - How connected they are to their mission and values  
3. **Profit (Financial Health)** - How sustainable and profitable their business is

Each dimension is scored 0-100. The overall business health is determined by:

- 0-40: Survival Phase - Focus on immediate cash flow and stability
- 41-60: Growth Phase - Build systems and team capacity
- 61-80: Expansion Phase - Scale and optimize operations
- 81-100: Legacy Phase - Create lasting impact and freedom

Provide guidance that is:
- Compassionate and non-judgmental
- Practical with specific next steps
- Aligned with their values and vision
- Focused on one priority at a time
- Celebratory of progress made

`;

export async function POST(request: NextRequest) {
  try {
    const { name, key, instructions, notes } = await resolveAiConfig();
    // Red flags first, before anything else can answer: a client in distress gets the fixed caring reply with
    // crisis resources (whatever the AI key or cap says), and a person on the team is told. See lib/ai/redFlags.ts.
    const early = await request.clone().json().catch(() => ({}));
    const earlyPlan = typeof early?.message === "string" && early.message ? await resolveMasterPlanId() : null;
    const flag = earlyPlan ? await screenMessage(earlyPlan, early.message) : { crisis: false, hint: "" };
    if (flag.crisis && earlyPlan) {
      await saveTurn(earlyPlan, "guide", String(early.message), CRISIS_REPLY).catch((e) => console.error("saveTurn:", e));
      return NextResponse.json({ reply: CRISIS_REPLY });
    }
    const overCap = await memberAiGate(key);
    if (overCap) return overCap;
    // Check if an OpenAI API key is configured (per-account or env)
    if (!key) {
      return NextResponse.json({
        reply: `I'm ${name} — add your AI key (Claude or OpenAI) in Settings → AI Assistant to get personalized guidance. In the meantime, focus on one priority: What's the single most important action you could take this week to move your business forward?`
      });
    }

    // The client's own plan (fails closed when nobody is signed in).
    const planId = await resolveMasterPlanId();
    if (!planId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Initialize OpenAI client with the resolved key
    const openai = aiClient(key);

    // Prepare context about the user's business
    let contextPrompt = "";
    if (context) {
      contextPrompt = `\n\nUser Context:\n`;
      if (context.brainScore !== undefined) {
        contextPrompt += `- Brain (Systems): ${context.brainScore}/100\n`;
      }
      if (context.soulScore !== undefined) {
        contextPrompt += `- Soul (Purpose): ${context.soulScore}/100\n`;
      }
      if (context.profitScore !== undefined) {
        contextPrompt += `- Profit (Finance): ${context.profitScore}/100\n`;
      }
      if (context.overallScore !== undefined) {
        contextPrompt += `- Overall Health: ${context.overallScore}/100\n`;
      }
      if (context.focusAreas?.length > 0) {
        contextPrompt += `- Focus Areas: ${context.focusAreas.join(", ")}\n`;
      }
    }

    // Ground the answer in this client's own assessments and remember the chat.
    const tz = await resolveUserTimeZone(null);
    const [knowledge, history] = await Promise.all([
      buildAssistantKnowledge(planId, tz, { mailOwnerId: await currentMailOwner() }),
      loadHistory(planId, tz),
    ]);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: assistantSystemPrompt(name, systemPrompt(name), knowledge, contextPrompt, [instructions, flag.hint].filter(Boolean).join("\n\n"), { notes, message, approvedHelp: await approvedHelpFor(message) }) },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || 
      "I'm here to help you align your business with your vision. What would you like to explore today?";

    await saveTurn(planId, "guide", String(message), reply).catch((e) => console.error("saveTurn:", e));
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Guide Error:", error);
    return NextResponse.json({
      reply: "I'm here to support your business journey. While I process that, consider this: What's one small step you could take today to move closer to your vision?"
    });
  }
}
