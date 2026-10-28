import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { crmAccount } from "../../crm/guard";
import * as microsoft from "@/lib/microsoft";
import { logEvent } from "@/lib/crm";
import { replyText } from "@/lib/coldEmailReplies";

export const dynamic = "force-dynamic";

// What a prospect wrote back to a cold email, shown on their card, and the answer sent from the card.
//   GET  ?cardId= → { replies: [{ id, kind, subject, preview, receivedAt, answeredAt, answerText }], body }
//                   body = the whole text of the newest message, read from the inbox (null if it can't be read just now)
//   POST { cardId, replyId, text } → answers that message in its own thread from the connected Microsoft 365 inbox
// Babs-only like the rest of the cold email sender.
type Row = { id: string; message_id: string; from_email: string | null; kind: string; subject: string | null; preview: string | null; received_at: string; answered_at: string | null; answer_text: string | null };
const COLS = "id, message_id, from_email, kind, subject, preview, received_at, answered_at, answer_text";

async function allowed(request?: Request) {
  const a = await crmAccount(request);
  if ("denied" in a) return { denied: a.denied };
  if (!a.house && !a.isArchitect) return { denied: NextResponse.json({ error: "Cold email is not open for this account." }, { status: 403 }) };
  return { a };
}

export async function GET(request: Request) {
  const g = await allowed();
  if (!g.a) return g.denied;
  const cardId = new URL(request.url).searchParams.get("cardId") ?? "";
  const db = createServerClient();
  const { data } = await db.from("cold_email_replies").select(COLS).eq("master_plan_id", g.a.planId).eq("card_id", cardId).order("received_at", { ascending: false }).limit(10);
  const rows = (data ?? []) as Row[];
  let body: string | null = null;
  if (rows[0]) {
    const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", g.a.planId).maybeSingle();
    const token = plan?.user_id ? await microsoft.getValidAccessToken({ ownerId: plan.user_id as string }).catch(() => null) : null;
    if (token) {
      const m = await microsoft.fetchMessage(token, rows[0].message_id).catch(() => null);
      if (m) body = replyText(m.bodyHtml ?? m.bodyText, Boolean(m.bodyHtml)) || null;
    }
  }
  return NextResponse.json({
    replies: rows.map((r) => ({ id: r.id, kind: r.kind, fromEmail: r.from_email, subject: r.subject, preview: r.preview, receivedAt: r.received_at, answeredAt: r.answered_at, answerText: r.answer_text })),
    body,
  });
}

export async function POST(request: Request) {
  const g = await allowed(request);
  if (!g.a) return g.denied;
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 8000) : "";
  if (!text) return NextResponse.json({ error: "Write your reply first." }, { status: 400 });
  const db = createServerClient();
  const { data: row } = await db.from("cold_email_replies").select(`${COLS}, card_id`).eq("id", typeof b.replyId === "string" ? b.replyId : "").eq("card_id", typeof b.cardId === "string" ? b.cardId : "").eq("master_plan_id", g.a.planId).maybeSingle();
  if (!row) return NextResponse.json({ error: "That message was not found." }, { status: 404 });
  if (row.kind !== "reply") return NextResponse.json({ error: "They asked not to be contacted, so there is nothing to answer." }, { status: 400 });
  const { data: card } = await db.from("dm_cards").select("id, name, notes, contact_id, email").eq("id", row.card_id).eq("master_plan_id", g.a.planId).maybeSingle();
  if (!card) return NextResponse.json({ error: "Not found." }, { status: 404 });
  // Never answer a message that did not come from the address on the card.
  if (!row.from_email || !card.email || row.from_email.toLowerCase() !== (card.email as string).toLowerCase()) return NextResponse.json({ error: "This message came from a different address than the card, so reply from Outlook." }, { status: 400 });
  const { data: plan } = await db.from("client_master_plans").select("user_id").eq("id", g.a.planId).maybeSingle();
  const token = plan?.user_id ? await microsoft.getValidAccessToken({ ownerId: plan.user_id as string }).catch(() => null) : null;
  if (!token) return NextResponse.json({ error: "Connect your Microsoft 365 inbox in Settings > Integrations first." }, { status: 400 });
  try {
    await microsoft.replyWithText(token, row.message_id as string, text);
  } catch (e) {
    console.error("cold reply send:", e);
    return NextResponse.json({ error: "The reply did not send. Please try again, or answer from Outlook." }, { status: 502 });
  }
  const now = new Date().toISOString();
  await db.from("cold_email_replies").update({ answered_at: now, answer_text: text }).eq("id", row.id);
  const day = new Date().toLocaleDateString("en-US", { timeZone: "America/Denver", month: "short", day: "numeric" });
  await db.from("dm_cards").update({ notes: [(card.notes as string | null)?.trim(), `You replied (${day}): ${text.replace(/\s+/g, " ").slice(0, 300)}`].filter(Boolean).join("\n"), last_contacted_at: now, updated_at: now }).eq("id", card.id);
  if (card.contact_id) await logEvent(g.a.planId, card.contact_id as string, "email", `Cold email: you replied to ${card.name}`, { dm_card: card.id }, db as never).catch(() => {});
  return NextResponse.json({ ok: true, answeredAt: now });
}
