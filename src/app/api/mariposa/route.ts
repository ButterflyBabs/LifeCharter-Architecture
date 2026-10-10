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
import { approvedHelpFor } from "@/lib/ai/helpSuggestions";
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
// A request to write or revise a plan section: the answer must come back as an Approve card, not as text in the chat.
const PLAN_WRITE_ASK = /\b(write|draft|fill|revise|rewrite|update|complete|add to)\b[^.?!]{0,60}\b(section|plan)\b/i;

// On a plan page, tell the assistant which plan they mean so "my Ideal Client section" lands in the right one.
function pageKind(page: string): string {
  return /marketing plan/i.test(page) ? "marketing" : /sales plan/i.test(page) ? "sales" : /business plan/i.test(page) ? "business" : /forecast/i.test(page) ? "forecasting" : "";
}
// If they are on a plan page and did not name a different plan, the plan on the page is the one they mean.
function pinPlan(name: string, rawArgs: string, page: string, message: string): string {
  if (name !== "update_plan_section" && name !== "read_plan" && name !== "fill_plan_answers") return rawArgs;
  const kind = pageKind(page);
  if (!kind || /\b(business|marketing|sales|forecast\w*)\b/i.test(message)) {
    if (name !== "fill_plan_answers" || !/\b(each|every|all|whole|entire)\b/i.test(message)) return rawArgs;
    try {
      const a = JSON.parse(rawArgs);
      delete a.section;
      return JSON.stringify(a);
    } catch {
      return rawArgs;
    }
  }
  try {
    const a = { ...JSON.parse(rawArgs), plan_type: kind };
    // "each section" / "my whole plan" is ONE approval for the plan, not one card per section.
    if (name === "fill_plan_answers" && /\b(each|every|all|whole|entire)\b/i.test(message)) delete a.section;
    return JSON.stringify(a);
  } catch {
    return rawArgs;
  }
}

function planHint(page: string): string {
  const kind = pageKind(page);
  return kind ? ` If they ask you to write or change a plan section here, they mean their ${kind} plan: use plan_type "${kind}" unless they name a different plan.` : "";
}

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
    const sys = assistantSystemPrompt(name, persona(name), knowledge, (page ? `\nThey are currently on the "${page}" part of the app.${planHint(page)}` : ""), instructions, { notes, message, canAct, approvedHelp: await approvedHelpFor(message) });
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: sys }, ...history, { role: "user", content: message }];
    const cards: ActionCard[] = [];
    const ctx = canAct ? { planId: planId as string, userEmail: (await sessionUser())?.email ?? null, db: createServerClient() } : null;
    let reply = "";
    let nudged = false;
    const usedOnce = new Set<string>();
    for (let round = 0; round < 4; round++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: canAct ? 1600 : 700,
        temperature: 0.5,
        ...(canAct ? { tools: openAiToolDefs() } : {}),
      });
      const msg = completion.choices[0]?.message;
      reply = msg?.content?.trim() ?? "";
      const calls = (msg?.tool_calls ?? []).filter((c) => c.type === "function");
      // The assistant said it prepared something but never called a tool: nothing exists to approve.
      // Push it once to actually do it, rather than showing the client a promise with no preview.
      if (!calls.length && ctx && cards.length === 0 && !nudged && (/\b(i['’]?ve prepared|i have prepared|i prepared|ready for your approval|press approve|prepared (it|this|that|the))\b/i.test(reply) || (reply.length > 300 && PLAN_WRITE_ASK.test(message)))) {
        nudged = true;
        messages.push({ role: "assistant", content: reply });
        messages.push({ role: "user", content: "You wrote this in the chat without calling a tool, so there is nothing for me to approve or save. Call read_plan if you need the section keys, then call update_plan_section (or the right tool) now with the complete text, and keep your chat reply to one short line." });
        reply = "";
        continue;
      }
      if (!calls.length || !ctx) break;
      messages.push({ role: "assistant", content: msg?.content ?? null, tool_calls: msg!.tool_calls });
      for (const c of calls) {
        const once = c.function.name === "fill_plan_answers";
        const out = once && usedOnce.has(c.function.name) ? "Already prepared in this reply; do not call it again." : await handleToolCall(c.function.name, pinPlan(c.function.name, c.function.arguments, page, message), ctx, cards);
        if (once) usedOnce.add(c.function.name);
        messages.push({ role: "tool", tool_call_id: c.id, content: out });
      }
      reply = "";
    }
    // On a plan page the card is pinned to that plan; if the chat text names a different plan, say it plainly instead.
    const pk = pageKind(page);
    if (pk && cards.some((c) => ["update_plan_section", "fill_plan_answers"].includes(c.tool))) {
      const labels: Record<string, string> = { business: "Business Plan", marketing: "Marketing Plan", sales: "Sales Plan", forecasting: "Forecast Plan" };
      if (Object.entries(labels).some(([k, l]) => k !== pk && reply.includes(l))) reply = "";
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
    .is("archive_id", null)
    .order("created_at", { ascending: false })
    .limit(40);
  return NextResponse.json({
    messages: ((data ?? []) as { id: string; role: string; content: string; created_at: string }[])
      .reverse()
      // The morning briefing is asked with a long behind-the-scenes prompt; show it as a short line.
      .map((m) => (m.role === "user" && m.content.startsWith("Give me my morning briefing") ? { ...m, content: "Give me my morning briefing" } : m)),
  });
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
