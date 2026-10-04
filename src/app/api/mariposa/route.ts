import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveUserTimeZone } from "@/lib/userTimezone";
import { currentMailOwner } from "@/lib/mailOwner";
import { buildAssistantKnowledge, loadHistory, saveTurn, clearHistory, assistantSystemPrompt } from "@/lib/ai/assistantContext";
import { memberAiGate } from "@/lib/ai/memberCap";
import { createServerClient } from "@/lib/supabase/server";
import { openAiToolDefs } from "@/lib/ai/actions/registry";
import { handleToolCall, type ActionCard } from "@/lib/ai/actions/engine";
import { isDemoRequest } from "@/lib/scoring/masterPlan";
import { sessionUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

// The assistant persona — {name} is the account's configured assistant name.
function persona(name: string): string {
  return `You are ${name}, the executive-assistant AI in the LifeCharter Command Suite, focused on daily execution and momentum.

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
  if (message.length > 12000) {
    return NextResponse.json({ error: "message too long" }, { status: 413 });
  }
  const page = typeof body?.page === "string" ? body.page.slice(0, 60) : "";
  // What the chat shows for this message when the text sent to the assistant is long (for example an edit request).
  const shown = typeof body?.shown === "string" && body.shown.trim() ? body.shown.trim().slice(0, 300) : message;

  const { name, key, instructions, notes } = await resolveAiConfig();
  const overCap = await memberAiGate(key);
  if (overCap) return overCap;

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
      ? await Promise.all([buildAssistantKnowledge(planId, tz, { mailOwnerId: await currentMailOwner() }), loadHistory(planId)])
      : [{ text: "", answered: 0 }, []];

    const openai = new OpenAI({ apiKey: key });
    // The assistant can also DO things (tools). Not in the public demo, which is view-only.
    const canAct = !!planId && !isDemoRequest();
    const sys = assistantSystemPrompt(name, persona(name), knowledge, page ? `\nThey are currently on the "${page}" part of the app.` : "", instructions, { notes, message, canAct });
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: sys }, ...history, { role: "user", content: message }];
    const cards: ActionCard[] = [];
    const ctx = canAct ? { planId: planId as string, userEmail: (await sessionUser())?.email ?? null, db: createServerClient() } : null;
    let reply = "";
    for (let round = 0; round < 4; round++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 700,
        temperature: 0.5,
        ...(canAct ? { tools: openAiToolDefs() } : {}),
      });
      const msg = completion.choices[0]?.message;
      reply = msg?.content?.trim() ?? "";
      const calls = (msg?.tool_calls ?? []).filter((c) => c.type === "function");
      if (!calls.length || !ctx) break;
      messages.push({ role: "assistant", content: msg?.content ?? null, tool_calls: msg!.tool_calls });
      for (const c of calls) {
        const out = await handleToolCall(c.function.name, c.function.arguments, ctx, cards);
        messages.push({ role: "tool", tool_call_id: c.id, content: out });
      }
      reply = "";
    }
    if (!reply && cards.length) reply = cards.length === 1 ? "Here is what I would do. Review it and press Approve when you are ready." : "Here is what I would do. Review each one and press Approve when you are ready.";
    if (planId && reply) await saveTurn(planId, "mariposa", shown, reply).catch((e) => console.error("saveTurn:", e));
    return NextResponse.json({ reply, actions: cards });
  } catch (e) {
    console.error("POST /api/mariposa:", e);
    return NextResponse.json({
      reply: `I hit a snag reaching my brain just now — give me a moment and try again. — ${name}`,
    });
  }
}

// The recent conversation, so the chat is still there when the client comes back to the page.
export async function GET() {
  const planId = await resolveMasterPlanId();
  if (!planId) return NextResponse.json({ messages: [] });
  const { data } = await createServerClient()
    .from("assistant_messages")
    .select("id, role, content, created_at")
    .eq("master_plan_id", planId)
    .order("created_at", { ascending: false })
    .limit(40);
  return NextResponse.json({ messages: ((data ?? []) as { id: string; role: string; content: string; created_at: string }[]).reverse() });
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
