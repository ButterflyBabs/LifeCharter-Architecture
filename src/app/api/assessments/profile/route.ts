import { insightRoute, text } from "@/lib/ai/insightRoute";
import { cleanList } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

// The Alignment Profile: a written portrait of the founder and the business,
// synthesized from their Brain, Soul and Profit assessments (sensitive answers
// are never included). Stored, and shared with every AI feature so they all start
// from the same understanding of who this client is.
export const { GET, POST } = insightRoute({
  area: "profile",
  role: "the client's own assistant, writing their Alignment Profile.",
  rules:
    "Write a warm, honest portrait from what they've told you in their Brain, Soul and Profit assessments (themes only — never quote answers at length, never include anything private). Note what is still unanswered so they know how to sharpen it. " +
    'Return STRICT JSON: {"summary":"3-4 sentences: who they are as a founder and what their business is trying to be","who":"2-3 sentences on their values, calling and story","business":"2-3 sentences on how the business actually runs today","money":"1-2 sentences on the financial reality (only if shown)","strengths":[{"title":"short","detail":"specific"}],"tensions":[{"title":"short","detail":"where their stated values, goals and reality pull apart"}],"unanswered":"one sentence on what would sharpen this profile"}. ' +
    "2-4 strengths, 1-3 tensions. If they've answered very little, keep it short and say what to answer next. Never invent.",
  ask: "Write my Alignment Profile.",
  maxTokens: 1300,
  shape: (o) => {
    const summary = text(o.summary);
    if (!summary) return null;
    return { summary, who: text(o.who), business: text(o.business), money: text(o.money), strengths: cleanList(o.strengths, 4, ["title", "detail"]), tensions: cleanList(o.tensions, 3, ["title", "detail"]), unanswered: text(o.unanswered, 300) };
  },
});
