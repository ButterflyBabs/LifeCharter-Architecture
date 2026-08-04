import { NextResponse } from "next/server";
import OpenAI from "openai";
import { crossOriginBlocked } from "@/lib/security";
import { resolveAiConfig } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

// Drafts a follow-up email (subject + body) with the client's AI bot, written as
// the founder to their contact. Returns { subject, body } or { needsKey: true }.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const guidance = typeof body.guidance === "string" ? body.guidance.trim() : "";
  const senderName = typeof body.senderName === "string" ? body.senderName.trim() : "";

  const { name, key } = await resolveAiConfig();
  if (!key) return NextResponse.json({ needsKey: true });

  const sys =
    `You are ${name}, drafting a warm, concise follow-up EMAIL that the founder will send to a contact. ` +
    `Write in the founder's first-person voice (not as an assistant). Keep it 60-120 words, friendly and specific, ` +
    `with a clear single call to action. Do not invent facts, prices, or dates that weren't provided. ` +
    (senderName ? `Sign off as ${senderName}. ` : `End with a simple sign-off. `) +
    `Respond ONLY as strict JSON: {"subject": "...", "body": "..."} with plain-text body (use \\n for line breaks).`;

  const user =
    `Contact: ${contactName || "the contact"}.` +
    (guidance ? ` Purpose / notes for this follow-up: ${guidance}.` : ` This is a general check-in follow-up.`);

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      max_tokens: 400,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: { subject?: string; body?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const subject = (parsed.subject || "").toString().trim() || `Following up, ${contactName || "hello"}`;
    const bodyText = (parsed.body || "").toString().trim();
    if (!bodyText) {
      return NextResponse.json({ error: "Couldn't draft the email." }, { status: 502 });
    }
    return NextResponse.json({ subject, body: bodyText });
  } catch (e) {
    console.error("POST /api/followups/draft:", e);
    return NextResponse.json({ error: "Couldn't draft the email." }, { status: 502 });
  }
}
