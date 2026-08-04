import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabase/server";
import { crossOriginBlocked } from "@/lib/security";
import { resolveMasterPlanId } from "@/lib/scoring/masterPlan";
import { resolveAiConfig } from "@/lib/ai/config";
import { searchKb, KNOWLEDGE_BASE, type KbEntry } from "@/lib/knowledgeBase";

export const dynamic = "force-dynamic";

// Travel Partner "Ask": answers a client's question strictly from the knowledge
// base (built-in + this client's custom Q&A). It only recommends contacting
// support when the KB genuinely doesn't cover the question — so clients get the
// latest, accurate answer first.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) {
    return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "Ask me something." }, { status: 400 });

  // Merge the client's custom Q&A into the searchable set.
  const supabase = createServerClient();
  const masterPlanId = await resolveMasterPlanId();
  let custom: KbEntry[] = [];
  if (masterPlanId) {
    const { data } = await supabase
      .from("qa_entries")
      .select("id, category, question, answer, keywords")
      .eq("master_plan_id", masterPlanId);
    custom = ((data || []) as {
      id: string;
      category: string | null;
      question: string;
      answer: string;
      keywords: string | null;
    }[]).map((r) => ({
      id: `custom:${r.id}`,
      category: r.category || "General",
      question: r.question,
      answer: r.answer,
      keywords: (r.keywords || "").split(",").map((k) => k.trim()).filter(Boolean),
    }));
  }

  // Retrieve from built-in KB, then fold in any custom entries that match.
  const builtin = searchKb(question, 5);
  const q = question.toLowerCase();
  const customMatches = custom.filter((e) => {
    const hay = `${e.question} ${e.answer} ${e.keywords.join(" ")}`.toLowerCase();
    return q.split(/[^a-z0-9]+/).filter((t: string) => t.length > 2).some((t: string) => hay.includes(t));
  });
  const matched = [...customMatches, ...builtin].slice(0, 6);

  const sources = matched.map((m) => ({ id: m.id, question: m.question, category: m.category }));

  const { name, key } = await resolveAiConfig();

  // Graceful fallback with no AI key: return the single best KB answer verbatim.
  if (!key) {
    if (matched.length > 0) {
      return NextResponse.json({
        answer: matched[0].answer,
        escalate: false,
        sources,
        source: "kb",
      });
    }
    return NextResponse.json({
      answer:
        "I couldn't find that in the knowledge base. Reaching out to support is your best next step for this one.",
      escalate: true,
      sources: [],
      source: "kb",
    });
  }

  const context = matched.length
    ? matched.map((m, i) => `[${i + 1}] Q: ${m.question}\nA: ${m.answer}`).join("\n\n")
    : "(no matching knowledge-base entries)";

  const sys =
    `You are ${name}, the friendly in-app guide for LifeCharter Command Suite. ` +
    "Answer the user's question using ONLY the knowledge-base entries provided. " +
    "Be warm, concise, and practical — 1-3 short sentences, plain language, no invented features. " +
    "If the entries fully answer the question, set escalate=false and answer directly. " +
    "If the entries do NOT cover the question (or only partially), give whatever partial help you can from them, then set escalate=true so the app can offer to contact support. " +
    'Return STRICT JSON: {"answer":"your reply","escalate":true|false}. Never fabricate steps or features not in the entries.';

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Knowledge base:\n${context}\n\nUser question: ${question}` },
      ],
      max_tokens: 400,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed: { answer?: string; escalate?: boolean } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const answer =
      String(parsed.answer || "").trim() ||
      (matched[0]?.answer ?? "I'm not sure about that one — support can help.");
    const escalate = typeof parsed.escalate === "boolean" ? parsed.escalate : matched.length === 0;
    return NextResponse.json({ answer, escalate, sources, source: "ai" });
  } catch (e) {
    console.error("POST /api/travel-partner/ask:", e);
    // Fall back to the best KB answer if the model call fails.
    if (matched.length > 0) {
      return NextResponse.json({ answer: matched[0].answer, escalate: false, sources, source: "kb" });
    }
    return NextResponse.json({
      answer: "I couldn't reach the assistant just now. Try again, or reach out to support.",
      escalate: true,
      sources: [],
      source: "kb",
    });
  }
}

// A tiny GET so the count of KB topics is available if needed.
export async function GET() {
  return NextResponse.json({ topics: KNOWLEDGE_BASE.length });
}
