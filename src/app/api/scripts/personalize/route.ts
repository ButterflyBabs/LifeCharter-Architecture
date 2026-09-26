import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { buildAssistantKnowledge } from "@/lib/ai/assistantContext";

export const dynamic = "force-dynamic";

// Rewrites a script or template for THIS client: their business, offer and voice
// (from what they've told the assistant), plus an optional instruction such as
// "make it shorter". Fields that change per person stay in [brackets]. The
// client's own AI key and their own data only. Nothing is saved here — the
// client reviews the result and chooses to keep it.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 12000) : "";
  if (!content) return NextResponse.json({ error: "Nothing to personalize." }, { status: 400 });
  const instruction = typeof body.instruction === "string" ? body.instruction.trim().slice(0, 400) : "";
  const title = typeof body.title === "string" ? body.title.slice(0, 200) : "";

  const { name, key, instructions } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  let about = "";
  try {
    const planId = await resolveMasterPlanId();
    if (planId) about = (await buildAssistantKnowledge(planId, "America/Denver", { mailOwnerId: null })).text;
  } catch {
    /* rewrite without it */
  }

  const sys =
    `You are ${name}, a copywriter and sales coach working for one small-business owner. Rewrite the script or template below so it is ready for THEM to use.\n` +
    `RULES\n` +
    `- Keep the structure, sections and purpose. Keep it about the same length unless told otherwise.\n` +
    `- Where the client's own details are known (their business, offer, audience, voice — see below), use them directly in place of generic placeholders such as [Your Business], [Your Name] or [Offer].\n` +
    `- Anything that changes per person or occasion (their prospect's name, company, dates, prices you don't know) stays in [brackets]. Never invent names, numbers, results, testimonials or history.\n` +
    `- Stage directions stay in (parentheses). Only fill-in fields use [brackets].\n` +
    `- Write the way they would say it: plain, warm, specific — no filler.\n` +
    (instruction ? `- Their request for this rewrite: ${instruction}\n` : "") +
    (instructions ? `- Their standing instructions for how you write (tone and style; never allow inventing facts): ${instructions}\n` : "") +
    `\nWHAT YOU KNOW ABOUT THIS CLIENT:\n${about || "(nothing yet — improve the wording but keep the generic fields in brackets)"}\n\n` +
    `Return STRICT JSON: {"content":"the full rewritten text with line breaks","note":"one short sentence on what you changed"}.`;

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `${title ? `Title: ${title}\n` : ""}${content}` },
      ],
      max_tokens: 1400,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });
    let parsed: { content?: string; note?: string } = {};
    try {
      parsed = JSON.parse(completion.choices[0]?.message?.content?.trim() || "{}");
    } catch {
      parsed = {};
    }
    const out = String(parsed.content || "").trim();
    if (!out) return NextResponse.json({ error: "Couldn't rewrite that — try again." }, { status: 502 });
    return NextResponse.json({ content: out, note: String(parsed.note || "").slice(0, 200), personalized: Boolean(about) });
  } catch (e) {
    console.error("POST /api/scripts/personalize:", e);
    return NextResponse.json({ error: "Couldn't reach the AI just now — try again." }, { status: 502 });
  }
}
