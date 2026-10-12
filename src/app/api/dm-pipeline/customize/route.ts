import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import { crossOriginBlocked } from "@/lib/security";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";
import { memberAiGate } from "@/lib/ai/memberCap";

export const dynamic = "force-dynamic";

// The client's own assistant rewrites ONE outreach message for ONE card (the window with Copy message, Open profile
// and I sent it), using what it knows about the client and what the card says about the person. Nothing is saved or
// sent: the new text goes back into the message box for them to read, change and copy.
//   POST { cardId, text, instruction? } -> { message }
const PLATFORM: Record<string, string> = { IG: "Instagram", FB: "Facebook", LI: "LinkedIn" };

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await crmAccount();
  if ("denied" in a) return a.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = typeof b.text === "string" ? b.text.slice(0, 3000) : "";
  const instruction = typeof b.instruction === "string" && b.instruction.trim() ? b.instruction.trim().slice(0, 400) : "Make it feel more personal to this person.";
  if (!text.trim()) return NextResponse.json({ error: "There is no message to work on yet." }, { status: 400 });

  const db = createServerClient();
  const { data: card } = await db
    .from("dm_cards")
    .select("name, handle, platform, notes, script_title, last_contacted_at, stage_id")
    .eq("id", String(b.cardId ?? ""))
    .eq("master_plan_id", a.planId)
    .maybeSingle();
  if (!card) return NextResponse.json({ error: "That card wasn't found." }, { status: 404 });

  const assistant = await planningAssistant();
  if (!assistant?.key) return NextResponse.json({ needsKey: true });
  const overCap = await memberAiGate();
  if (overCap) return overCap;

  const platform = PLATFORM[String(card.platform ?? "")] ?? "";
  const isNote = /connection (opener|note)/i.test(String(b.scriptTitle ?? "")) || b.connectionNote === true;
  const sys = planningSystem(
    assistant,
    "personalising one outreach message the client is about to send to one person.",
    'Return STRICT JSON: {"message":"the full rewritten message"}. ' +
      "Keep the client's voice and what the message is for. Do what the instruction asks and change as little else as you can. " +
      "Keep every web address, date, time and [bracketed placeholder] exactly as written unless the card gives the real value. " +
      "Use ONLY what the card says about the person; never invent details about them, their business or your history together; if the card says little, keep it warm and general rather than guessing. " +
      "Write it as a message a real person would send: no hashtags, no emoji unless the original used them, no subject line, no sign-off block unless the original had one. " +
      (isNote ? "This is a LinkedIn connection request note: keep it under 200 characters. " : platform ? `It will be sent on ${platform}, so keep the length natural for that platform. ` : "")
  );
  const user =
    `THE PERSON\nName: ${String(card.name ?? "").slice(0, 120)}\nHandle: ${String(card.handle ?? "").slice(0, 80)}\nPlatform: ${platform || "not set"}\n` +
    `Notes about them: ${String(card.notes ?? "").slice(-700) || "(none)"}\n` +
    `${card.last_contacted_at ? "They have been messaged before (see notes).\n" : "First message to them.\n"}\n` +
    `CURRENT MESSAGE\n${text}\n\nINSTRUCTION: ${instruction}`;
  const out = await runJson(assistant, sys, user, 900, 0.6);
  const message = typeof out?.message === "string" ? out.message.trim() : "";
  if (!message) return NextResponse.json({ error: "Couldn't rewrite it just now." }, { status: 502 });
  return NextResponse.json({ message: message.slice(0, 3000) });
}
