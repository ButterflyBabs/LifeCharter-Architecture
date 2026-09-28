import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { aiJson, collectiveAiFor, hasAiConsent, logAiUse } from "@/lib/community/ai";
import { memberSupabase } from "@/lib/community/memberDb";
import { toPlain } from "@/lib/community/mentions";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// Event recaps: an admin or the event's host (someone who can manage it)
// pastes their notes or the replay transcript and gets a draft recap post to
// edit and publish in the event's channel. Free for hosts (Babs's call): it
// runs on the host's own Command Suite AI if they have one, otherwise on
// LifeCharter's key — logged as "house", never counted against a Plus cap.
// Nothing is posted here; the host reviews and posts it themselves.

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  const db = memberSupabase();
  if (!user || !db) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const eventId = str(body.eventId, 40);
  const date = str(body.date, 10);
  const notes = str(body.notes, 60000);
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Missing event." }, { status: 400 });
  if (notes.length < 40) return NextResponse.json({ error: "Paste your notes or the replay transcript first." }, { status: 400 });

  // Access: read the event as this member (RLS), then confirm they can manage it.
  const { data: ev } = await db.from("cm_events").select("id, title, description, kind, space_ids, replay_url").eq("id", eventId).maybeSingle();
  if (!ev) return NextResponse.json({ error: "This event isn't available." }, { status: 404 });
  const { data: canManage } = await db.rpc("cm_can_manage_event", { p_ids: (ev.space_ids as string[] | null) ?? [] });
  if (canManage !== true) return NextResponse.json({ error: "Only the event's host or an admin can write its recap." }, { status: 403 });

  if (!(await hasAiConsent(user.id))) return NextResponse.json({ error: "Please allow Mariposa first.", needsConsent: true }, { status: 428 });
  const ai = await collectiveAiFor(user);
  const own = ai.source === "own" && ai.key;
  const key = own ? ai.key : process.env.PLUS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.openai_api_key || "";
  if (!key) return NextResponse.json({ error: "The AI isn't set up yet — please try again soon." }, { status: 503 });
  const name = own ? ai.name : "Mariposa";

  // Very long transcripts: keep the start and the end (where wrap-ups live).
  const source = notes.length > 24000 ? `${notes.slice(0, 16000)}\n…\n${notes.slice(-8000)}` : notes;
  const sys =
    `You are ${name}, helping a LifeCharter host write a recap post of a live session for the members of The LifeCharter Collective. ` +
    "Write warmly and plainly, as the host speaking to members (\"we\", \"you\"). No hype, no emojis, no hashtags. " +
    "title: a short, inviting title (<= 80 chars). " +
    "body: 120–250 words — a one-line opener, then 3–5 short key takeaways as lines starting with \"• \", then one reflection question for members to answer in the replies. " +
    "Only use what is in the notes; never invent quotes, names, numbers or stories. Don't name members who spoke unless the notes clearly want them credited. " +
    'Return STRICT JSON: {"title":"...","body":"..."}';
  const userText =
    `Session: ${ev.title}${ev.description ? ` — ${toPlain(ev.description as string).slice(0, 400)}` : ""}\nDate: ${date}\n\nHost's notes / transcript:\n${source}`;

  try {
    const parsed = await aiJson(key, sys, userText, 700, 0.5);
    await logAiUse(user.id, "event_recap", own ? "own" : "house");
    const result = { title: str(parsed.title, 120), body: str(parsed.body, 4000) };
    if (!result.body) return NextResponse.json({ error: `${name} couldn't write a recap from that — try again.` }, { status: 502 });
    return NextResponse.json({ result, assistantName: name, replayUrl: ev.replay_url ?? null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The AI didn't respond." }, { status: 502 });
  }
}
