import { NextResponse } from "next/server";
import { aiJson, logAiUse, memberAiGate } from "@/lib/community/ai";
import { memberSupabase } from "@/lib/community/memberDb";
import { gatherMissed } from "@/lib/community/missed";
import { toPlain } from "@/lib/community/mentions";

export const dynamic = "force-dynamic";

// Member AI features (co036), on the same rules as the journal assistant:
// the member's own Command Suite AI, or Collective Plus as Mariposa (capped per
// month), consent first, every call metered in cm_ai_usage. Anything read from
// the Collective is read through the member's OWN session, so RLS decides what
// the AI may see — nothing from a channel they can't open.
//
//   missed      — "What you missed" summary on Home
//   thread      — "Catch me up" on a long thread
//   rewrite     — "Help me say this" (warmer / clearer / shorter); never sends
//   tidy        — tidy a voice-journal transcript
//   focus_note  — a private takeaway from an event (Plus)

type Action = "missed" | "thread" | "rewrite" | "tidy" | "focus_note";
type Tone = "warmer" | "clearer" | "shorter";

const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const list = (v: unknown, n: number) => (Array.isArray(v) ? v.map((x) => str(x, n)).filter(Boolean) : []);
const flat = (s: string | null | undefined) => toPlain(s).replace(/\s+/g, " ").trim();
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const TONES: Record<Tone, string> = {
  warmer: "Make it warmer and more encouraging — kind, human, never gushing.",
  clearer: "Make it clearer — plain words, one idea per sentence, the point up front.",
  shorter: "Make it shorter — keep only what matters, roughly half the length or less.",
};

export async function POST(request: Request) {
  const gate = await memberAiGate(request);
  if (!gate.ok) return gate.response;
  const { user, ai } = gate;
  const db = memberSupabase();
  if (!db) return NextResponse.json({ error: "The AI isn't available right now." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const action = body.action as Action;
  const voice = `You are ${ai.name}, a warm, grounded LifeCharter coach inside The LifeCharter Collective, a private member community. Plain, kind words. No hype, no clichés, no emojis. `;

  let sys = "";
  let userText = "";
  let maxTokens = 400;
  let temperature = 0.5;
  let finish: (parsed: Record<string, unknown>) => Record<string, unknown> | null;

  if (action === "missed") {
    const since = str(body.since, 40);
    const t = Date.parse(since);
    if (!since || Number.isNaN(t)) return NextResponse.json({ error: "Missing time." }, { status: 400 });
    const floor = Date.now() - 14 * 86_400_000;
    const missed = await gatherMissed(db, user.id, new Date(Math.max(t, floor)).toISOString());
    if (!missed.threads.length) return NextResponse.json({ error: "Nothing new since your last visit." }, { status: 400 });
    const threads = missed.threads.slice(0, 12);
    sys =
      voice +
      "Catch this member up on what happened in their community channels while they were away. " +
      "summary: 2–3 friendly sentences on the overall feel and main themes. " +
      "highlights: up to 4 items, each {post_id, line} where line (<= 120 chars) says what's happening and why they might care. " +
      "Only use what's written below; never invent details; refer to people by the names given. " +
      'Return STRICT JSON: {"summary":"...","highlights":[{"post_id":"...","line":"..."}]}';
    userText = threads
      .map(
        (x) =>
          `[post_id ${x.postId}] ${x.channel.name} › ${x.pathway} — ${x.isNewPost ? `NEW POST by ${x.author}` : "earlier post"}: "${x.title}". ${x.isNewPost ? x.body : ""}` +
          (x.replies.length ? `\n  New replies: ${x.replies.map((r) => `${r.author}: ${r.text}`).join(" | ")}` : "")
      )
      .join("\n");
    maxTokens = 450;
    const byId = new Map(threads.map((x) => [x.postId, x]));
    finish = (p) => {
      const highlights = (Array.isArray(p.highlights) ? p.highlights : [])
        .map((h) => {
          const id = str((h as Record<string, unknown>)?.post_id, 40);
          const line = str((h as Record<string, unknown>)?.line, 160);
          const th = byId.get(id);
          return th && line ? { line, href: th.href, title: th.title } : null;
        })
        .filter(Boolean)
        .slice(0, 4);
      const summary = str(p.summary, 600);
      return summary || highlights.length ? { summary, highlights } : null;
    };
  } else if (action === "thread") {
    const postId = str(body.postId, 40);
    if (!/^[0-9a-f-]{36}$/i.test(postId)) return NextResponse.json({ error: "Missing post." }, { status: 400 });
    const [{ data: post }, { data: comments }] = await Promise.all([
      db.from("cm_posts").select("id, title, body, author_id").eq("id", postId).is("deleted_at", null).maybeSingle(),
      db.from("cm_comments").select("body, author_id, created_at").eq("post_id", postId).is("deleted_at", null).order("created_at").limit(200),
    ]);
    if (!post) return NextResponse.json({ error: "This post isn't available." }, { status: 404 });
    const rows = (comments as { body: string; author_id: string }[] | null) ?? [];
    if (rows.length < 3) return NextResponse.json({ error: "There isn't much to catch up on yet." }, { status: 400 });
    const ids = Array.from(new Set([post.author_id as string, ...rows.map((r) => r.author_id)])).slice(0, 200);
    const { data: people } = await db.from("cm_profiles").select("user_id, display_name").in("user_id", ids);
    const names = new Map(((people as { user_id: string; display_name: string }[] | null) ?? []).map((p) => [p.user_id, p.display_name]));
    const who = (id: string) => names.get(id) ?? "A member";
    // Keep the most recent replies if the thread is very long.
    const lines: string[] = [];
    let budget = 11000;
    for (const r of rows.slice().reverse()) {
      const l = `${who(r.author_id)}: ${flat(r.body).slice(0, 500)}`;
      if (budget - l.length < 0) break;
      budget -= l.length;
      lines.unshift(l);
    }
    sys =
      voice +
      "Summarize this community thread for a member who wants to catch up. " +
      "summary: 2–3 sentences on what the conversation is about and where it has landed. " +
      "points: up to 4 short key points or perspectives (<= 140 chars each), naming who said what where useful. " +
      "open: one open question or next step still being discussed, or empty. Only use what's written; never invent. " +
      'Return STRICT JSON: {"summary":"...","points":["..."],"open":"..."}';
    userText =
      `ORIGINAL POST by ${who(post.author_id as string)}${post.title ? ` — "${flat(post.title as string)}"` : ""}: ${flat(post.body as string).slice(0, 1500)}\n\n` +
      `REPLIES (${rows.length}${lines.length < rows.length ? `, latest ${lines.length} shown` : ""}):\n${lines.join("\n")}`;
    maxTokens = 450;
    finish = (p) => {
      const r = { summary: str(p.summary, 700), points: list(p.points, 200).slice(0, 4), open: str(p.open, 240) };
      return r.summary || r.points.length ? r : null;
    };
  } else if (action === "rewrite") {
    const text = str(body.text, 4000);
    const tone = body.tone as Tone;
    const where = body.where === "dm" ? "a private message to another member" : body.where === "reply" ? "a reply in a community thread" : "a community post";
    if (text.length < 8) return NextResponse.json({ error: "Write a little more first." }, { status: 400 });
    if (!TONES[tone]) return NextResponse.json({ error: "Pick warmer, clearer or shorter." }, { status: 400 });
    sys =
      `You help a member of The LifeCharter Collective say what they mean. Rewrite their draft of ${where} in THEIR OWN voice — ` +
      "first person, same meaning, same facts, same language, nothing added they didn't say, no new promises. " +
      `${TONES[tone]} Keep every @Name mention and every link exactly as written. No emojis unless they used them. No hashtags. ` +
      'Return STRICT JSON: {"text":"..."}';
    userText = text;
    maxTokens = Math.min(900, Math.ceil(text.length / 3) + 150);
    temperature = 0.4;
    finish = (p) => {
      const t = str(p.text, 5000);
      return t ? { text: t } : null;
    };
  } else if (action === "tidy") {
    const text = str(body.text, 6000);
    if (text.length < 8) return NextResponse.json({ error: "Nothing to tidy yet." }, { status: 400 });
    sys =
      "You tidy a spoken journal entry that was transcribed from a voice note. Keep the member's own words, voice and meaning, first person. " +
      "Remove filler (um, uh, you know, like), false starts and repeats; fix punctuation; break into short paragraphs. " +
      "Do not summarize, add, soften or change anything they said. " +
      'Return STRICT JSON: {"text":"..."}';
    userText = text;
    maxTokens = Math.min(1600, Math.ceil(text.length / 3) + 150);
    temperature = 0.2;
    finish = (p) => {
      const t = str(p.text, 7000);
      return t ? { text: t } : null;
    };
  } else if (action === "focus_note") {
    const eventId = str(body.eventId, 40);
    const date = str(body.date, 10);
    const thoughts = str(body.thoughts, 1500);
    if (!/^[0-9a-f-]{36}$/i.test(eventId) || !isDay(date)) return NextResponse.json({ error: "Missing event." }, { status: 400 });
    const { data: ev } = await db.from("cm_events").select("id, title, description, kind").eq("id", eventId).maybeSingle();
    if (!ev) return NextResponse.json({ error: "This event isn't available." }, { status: 404 });
    const { data: recap } = await db.from("cm_event_recaps").select("post_id").eq("event_id", eventId).eq("occurrence_date", date).maybeSingle();
    let recapText = "";
    if (recap?.post_id) {
      const { data: rp } = await db.from("cm_posts").select("title, body").eq("id", recap.post_id).is("deleted_at", null).maybeSingle();
      if (rp) recapText = flat(`${rp.title ?? ""}\n${rp.body}`).slice(0, 4000);
    }
    const { data: focus } = await db.from("cm_journal_focus").select("title, why").eq("user_id", user.id).eq("status", "active").order("starts_on", { ascending: false }).limit(1).maybeSingle();
    if (!recapText && !thoughts) return NextResponse.json({ error: "Jot down what stood out to you first — there's no recap for this session yet." }, { status: 400 });
    sys =
      voice +
      "Write this member a short personal focus note from a live session they were part of — private, for their journal. " +
      "takeaway: 2–3 sentences in THEIR voice (first person) naming the one idea from the session most useful to them, grounded in the recap and their own thoughts. " +
      "next_step: one small, concrete action for this week (<= 120 chars), first person. " +
      "If they have a 90-day focus and it fits, connect to it. Never invent what was said in the session. " +
      'Return STRICT JSON: {"takeaway":"...","next_step":"..."}';
    userText =
      `Session: ${ev.title}${ev.description ? ` — ${flat(ev.description as string).slice(0, 500)}` : ""}\n` +
      (recapText ? `Host's recap: ${recapText}\n` : "") +
      (thoughts ? `What stood out to them: ${thoughts}\n` : "") +
      (focus ? `Their 90-day focus: ${focus.title}${focus.why ? ` — why: ${focus.why}` : ""}\n` : "");
    maxTokens = 350;
    finish = (p) => {
      const r = { takeaway: str(p.takeaway, 700), next_step: str(p.next_step, 200) };
      return r.takeaway ? r : null;
    };
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  try {
    const parsed = await aiJson(ai.key, sys, userText, maxTokens, temperature);
    if (ai.source) await logAiUse(user.id, action, ai.source);
    const result = finish(parsed);
    if (!result) return NextResponse.json({ error: `${ai.name} couldn't come up with anything — try again.` }, { status: 502 });
    return NextResponse.json({ result, assistantName: ai.name });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The AI didn't respond." }, { status: 502 });
  }
}
