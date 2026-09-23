import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { aiJson, aiUnavailableMessage, collectiveAiFor, hasAiConsent, logAiUse } from "@/lib/community/ai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// The Alignment Journal's assistant. Runs on the member's own Command Suite AI,
// or — for Collective Plus members — on LifeCharter's Plus key as Mariposa.
// Journal text only goes to the AI when the member taps a button.

export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ enabled: false, assistantName: "Mariposa", plus: false, source: null });
  const ai = await collectiveAiFor(user);
  return NextResponse.json({
    enabled: Boolean(ai.key),
    assistantName: ai.name,
    plus: ai.plus,
    source: ai.source,
    unavailable: ai.source && !ai.key ? aiUnavailableMessage(ai) : null,
  });
}

type Action = "sharpen" | "unpack" | "reflect" | "lookback";

interface Entry {
  kind: string;
  week_start: string;
  headline: string | null;
  private_note: string | null;
  dimension: string | null;
  rating: number | null;
  carry_forward: string | null;
}

const clip = (s: unknown, n = 2000) => (typeof s === "string" ? s.trim().slice(0, n) : "");
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const list = (v: unknown, n: number) => (Array.isArray(v) ? v.map((x) => str(x, n)).filter(Boolean) : []);

function describe(e: Entry) {
  const bits = [`${e.kind.toUpperCase()} (week of ${e.week_start})`];
  if (e.headline) bits.push(`headline: ${e.headline}`);
  if (e.rating) bits.push(`alignment: ${e.rating}/5`);
  if (e.dimension) bits.push(`area: ${e.dimension}`);
  if (e.private_note) bits.push(`notes: ${e.private_note.slice(0, 600)}`);
  if (e.carry_forward) bits.push(`carry forward: ${e.carry_forward}`);
  return bits.join(" | ");
}

async function activeFocus(userId: string): Promise<string> {
  const { data } = await createServerClient()
    .from("cm_journal_focus")
    .select("title, why, ends_on")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? `Their current 90-day focus (until ${data.ends_on}): ${data.title}${data.why ? ` — why: ${data.why}` : ""}\n` : "";
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const ai = await collectiveAiFor(user);
  if (!ai.key) return NextResponse.json({ error: aiUnavailableMessage(ai), needsPlus: !ai.plus && !ai.source }, { status: 402 });
  if (!(await hasAiConsent(user.id))) return NextResponse.json({ error: "Please allow Mariposa first.", needsConsent: true }, { status: 428 });

  const body = await request.json().catch(() => ({}));
  const action = body.action as Action;
  const voice =
    `You are ${ai.name}, a warm, grounded LifeCharter coach helping a member with their private Alignment Journal. ` +
    "Speak to them directly, plainly and kindly. No hype, no clichés, no emojis. ";

  let sys = "";
  let userText = "";
  let maxTokens = 400;

  if (action === "sharpen") {
    const headline = clip(body.headline, 300);
    const note = clip(body.note);
    if (!headline && !note) return NextResponse.json({ error: "Write a rough intention first." }, { status: 400 });
    sys =
      voice +
      "Turn their rough weekly intention into ONE clear, specific, doable headline (<= 90 chars, first person, present tense) " +
      "and ONE concrete first step they can take in the next 24 hours (<= 120 chars). Keep their meaning and words where you can. " +
      "If they have a 90-day focus and the intention relates to it, make the connection visible. " +
      'Return STRICT JSON: {"headline":"...","first_step":"..."}';
    userText = `${await activeFocus(user.id)}Rough intention: ${headline || "(none)"}\nTheir notes: ${note || "(none)"}`;
  } else if (action === "unpack") {
    const headline = clip(body.headline, 300);
    if (!headline) return NextResponse.json({ error: "Write the win first." }, { status: 400 });
    sys =
      voice +
      "Ask exactly THREE short, specific reflection questions (<= 110 chars each) that help them see what made this win happen, " +
      "what it says about them, and how to repeat it. Tailor them to the win — nothing generic. " +
      'Return STRICT JSON: {"questions":["...","...","..."]}';
    userText = `Their win: ${headline}\nTheir notes so far: ${clip(body.note) || "(none)"}`;
  } else if (action === "reflect" || action === "lookback") {
    let q = createServerClient()
      .from("cm_journal_entries")
      .select("kind, week_start, headline, private_note, dimension, rating, carry_forward")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .order("created_at", { ascending: true });
    if (action === "reflect") {
      const week = clip(body.weekStart, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return NextResponse.json({ error: "Missing week." }, { status: 400 });
      q = q.eq("week_start", week).neq("kind", "reflection");
    } else {
      const since = clip(body.since, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(since)) q = q.gte("week_start", since);
      q = q.limit(120);
    }
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: "Couldn't read your journal." }, { status: 500 });
    const entries = (data as Entry[]) ?? [];
    const focus = await activeFocus(user.id);

    if (action === "reflect") {
      if (!entries.length) return NextResponse.json({ error: "Set an intention or capture a win this week first." }, { status: 400 });
      sys =
        voice +
        "Draft their end-of-week reflection from this week's intention and wins, written in THEIR voice (first person). " +
        "headline: their week in one honest sentence (<= 110 chars). note: 3–5 sentences on what moved, what got in the way, and what they learned — " +
        "only from what they wrote; never invent events. carry_forward: one thing to carry into next week (<= 100 chars). " +
        "Do not give a rating — they choose that. " +
        'Return STRICT JSON: {"headline":"...","note":"...","carry_forward":"..."}';
      userText = focus + entries.map(describe).join("\n");
      maxTokens = 500;
    } else {
      if (entries.length < 3) return NextResponse.json({ error: "Keep journaling for a few weeks — then there will be patterns to show you." }, { status: 400 });
      sys =
        voice +
        "Look across their journal and name 3–5 honest, specific patterns: which areas of life get attention and which keep slipping, " +
        "what their best-rated weeks have in common, intentions that keep recurring, and what their wins say about their strengths. " +
        "If they have a 90-day focus, say plainly how their weeks are tracking toward it. " +
        "Ground every point in what they actually wrote (mention weeks or words). End with one gentle suggestion for the coming week. " +
        'Return STRICT JSON: {"patterns":["...","..."],"suggestion":"..."}';
      userText = focus + entries.map(describe).join("\n");
      maxTokens = 700;
    }
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  try {
    const parsed = await aiJson(ai.key, sys, userText, maxTokens);
    const result =
      action === "sharpen"
        ? { headline: str(parsed.headline, 140), first_step: str(parsed.first_step, 200) }
        : action === "unpack"
          ? { questions: list(parsed.questions, 160).slice(0, 3) }
          : action === "reflect"
            ? { headline: str(parsed.headline, 140), note: str(parsed.note, 1500), carry_forward: str(parsed.carry_forward, 160) }
            : { patterns: list(parsed.patterns, 400).slice(0, 5), suggestion: str(parsed.suggestion, 300) };
    if (ai.source) await logAiUse(user.id, action, ai.source);
    const empty = Object.values(result).every((v) => (Array.isArray(v) ? v.length === 0 : !v));
    if (empty) return NextResponse.json({ error: `${ai.name} couldn't come up with anything — try again.` }, { status: 502 });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The AI didn't respond." }, { status: 502 });
  }
}
