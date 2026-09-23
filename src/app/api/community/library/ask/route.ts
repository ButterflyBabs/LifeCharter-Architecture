import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/authz";
import { aiJson, aiUnavailableMessage, collectiveAiFor, logAiUse } from "@/lib/community/ai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";

export const dynamic = "force-dynamic";

// "Ask the Library" (Collective Plus): answers a member's question from the
// Library items they can see — titles, descriptions and what Mariposa has
// been taught about each — and cites which items it used.

interface Res {
  id: string;
  title: string;
  description: string | null;
  category: string;
  ai_text: string | null;
  space_id: string | null;
}

const STOP = new Set("a an and are as at be but by can do does for from how i if in into is it its me my of on or our so than that the their them then there these they this to up was we what when where which who why will with you your".split(" "));
const words = (s: string) => s.toLowerCase().match(/[a-z0-9']+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) ?? [];

function chunks(r: Res): { id: string; title: string; text: string }[] {
  const head = `${r.title} (${r.category})${r.description ? ` — ${r.description}` : ""}`;
  const body = r.ai_text ?? "";
  if (!body) return [{ id: r.id, title: r.title, text: head }];
  const out: { id: string; title: string; text: string }[] = [];
  for (let i = 0; i < body.length; i += 1400) out.push({ id: r.id, title: r.title, text: `${head}\n${body.slice(i, i + 1600)}` });
  return out;
}

export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const ai = await collectiveAiFor(user);
  if (!ai.key) return NextResponse.json({ error: aiUnavailableMessage(ai), needsPlus: !ai.plus && !ai.source }, { status: 402 });

  const { question } = await request.json().catch(() => ({}));
  const q = typeof question === "string" ? question.trim().slice(0, 500) : "";
  if (q.length < 3) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });

  // Only items this member can see: the main Library plus their channels'.
  const supabase = createServerClient();
  const { data: mem } = await supabase.from("cm_space_members").select("space_id").eq("user_id", user.id);
  const spaceIds = ((mem as { space_id: string }[]) ?? []).map((m) => m.space_id);
  const { data } = await supabase.from("cm_resources").select("id, title, description, category, ai_text, space_id").is("deleted_at", null).limit(1000);
  const items = ((data as Res[]) ?? []).filter((r) => r.space_id === null || spaceIds.includes(r.space_id));
  if (!items.length) return NextResponse.json({ result: { answer: "The Library is still being stocked — there's nothing for me to draw on yet.", sources: [] } });

  const qw = new Set(words(q));
  const scored = items
    .flatMap(chunks)
    .map((c) => {
      const cw = words(c.text);
      let score = 0;
      for (const w of cw) if (qw.has(w)) score += 1;
      for (const w of words(c.title)) if (qw.has(w)) score += 3;
      return { ...c, score: score / Math.sqrt(cw.length + 20) };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
  let budget = 8000;
  const context: typeof scored = [];
  for (const c of scored) {
    if (budget - c.text.length < 0) continue;
    context.push(c);
    budget -= c.text.length;
    if (context.length >= 6) break;
  }
  // Nothing matched: give the model the catalogue so it can point somewhere.
  const catalogue = context.length ? "" : items.slice(0, 80).map((r) => `- ${r.title} (${r.category})${r.description ? `: ${r.description}` : ""}`).join("\n");

  const sys =
    `You are ${ai.name}, the LifeCharter guide. Answer the member's question using ONLY the LifeCharter Library excerpts provided. ` +
    "Be warm, clear and practical; 2–6 sentences, or a short list if it helps. If the excerpts don't cover it, say so honestly and suggest the closest Library item or asking in the community. " +
    "Never invent frameworks, steps or quotes. " +
    'Return STRICT JSON: {"answer":"...","source_titles":["exact titles of the items you used"]}';
  const userText =
    `Question: ${q}\n\n` +
    (context.length ? context.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n") : `No excerpt matched. Library catalogue:\n${catalogue}`);

  try {
    const p = await aiJson(ai.key, sys, userText, 600);
    const answer = typeof p.answer === "string" ? p.answer.trim().slice(0, 2500) : "";
    if (!answer) return NextResponse.json({ error: `${ai.name} couldn't answer that — try rephrasing.` }, { status: 502 });
    const titles = new Set(Array.isArray(p.source_titles) ? p.source_titles.map((t) => String(t).toLowerCase()) : []);
    const sources = items.filter((r) => titles.has(r.title.toLowerCase())).slice(0, 5).map((r) => ({ id: r.id, title: r.title }));
    if (ai.source) await logAiUse(user.id, "library", ai.source);
    return NextResponse.json({ result: { answer, sources } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The AI didn't respond." }, { status: 502 });
  }
}
