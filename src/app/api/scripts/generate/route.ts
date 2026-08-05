import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

// AI-drafts a script or template from a few guided answers. The UI asks the
// questions (purpose, audience, channel, tone, key points); this turns them into
// a ready-to-use, editable draft. Returns structured fields the client can save.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));

  const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
  if (!purpose) return NextResponse.json({ error: "Tell me what this script is for." }, { status: 400 });

  const audience = typeof body.audience === "string" ? body.audience.trim() : "";
  const channel = typeof body.channel === "string" ? body.channel.trim() : "sales";
  const tone = typeof body.tone === "string" ? body.tone.trim() : "warm and professional";
  const keyPoints = typeof body.keyPoints === "string" ? body.keyPoints.trim() : "";
  const itemType = body.itemType === "template" ? "template" : "script";

  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const channelLabel: Record<string, string> = {
    sales: "a spoken sales/phone call",
    email: "an email",
    dm: "a direct message (LinkedIn/social DM)",
    objection: "an objection-handling exchange",
    social: "a social media post",
  };

  const sys =
    `You are ${name}, an expert copywriter and sales coach for a small business owner. ` +
    `Write ${itemType === "template" ? "a reusable template" : "a script"} for ${channelLabel[channel] || "a client conversation"}. ` +
    "Use clear placeholders in [brackets] for anything personal (names, specifics, prices). " +
    (channel === "sales" || channel === "objection"
      ? "Structure it with labeled sections (e.g. OPENING, BRIDGE, PRESENT, CLOSE) and bracketed [stage directions] where a pause or listen is needed. "
      : "Keep it ready to send, with a subject line if it's an email. ") +
    `Match this tone: ${tone}. Be specific and genuinely usable — not generic filler. ` +
    'Return STRICT JSON: {"title":"short descriptive title","description":"one-line summary",' +
    '"category":"one of: Sales, Prospecting, Objections, Onboarding, Follow-up, Content, Nurture, Closing",' +
    '"tags":["3-5","short","tags"],"content":"the full script/template with line breaks"}.';

  const userText =
    `Purpose: ${purpose}\n` +
    (audience ? `Audience: ${audience}\n` : "") +
    `Channel: ${channelLabel[channel] || channel}\n` +
    (keyPoints ? `Key points to include: ${keyPoints}\n` : "") +
    `Type: ${itemType}`;

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userText },
      ],
      max_tokens: 1100,
      temperature: 0.6,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const content = String(parsed.content || "").trim();
    if (!content) return NextResponse.json({ error: "Couldn't draft that — try adding more detail." }, { status: 502 });

    const cats = ["Sales", "Prospecting", "Objections", "Onboarding", "Follow-up", "Content", "Nurture", "Closing"];
    const category = cats.includes(String(parsed.category)) ? String(parsed.category) : "Sales";

    return NextResponse.json({
      draft: {
        title: String(parsed.title || purpose).slice(0, 120),
        description: String(parsed.description || "").slice(0, 200),
        category,
        channel,
        itemType,
        tags: Array.isArray(parsed.tags) ? (parsed.tags as unknown[]).map(String).slice(0, 6) : [],
        content,
      },
    });
  } catch (e) {
    console.error("POST /api/scripts/generate:", e);
    return NextResponse.json({ error: "Couldn't reach the AI just now — try again." }, { status: 502 });
  }
}
