import { insightRoute, text } from "@/lib/ai/insightRoute";
import { cleanList } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

// The Progress read: what has actually moved since their baseline, and why —
// weighing score movement against how their plan goals, income and activity have
// gone — with what to do to keep the movement going.
export const { GET, POST } = insightRoute({
  area: "progress",
  role: "the client's progress partner, reading their movement since baseline.",
  rules:
    "Read how their scores have moved since baseline against how their plan goals are tracking (met / in progress / slipped), their income against goals, their sales pace and tasks above. Be honest: name real gains and real slippage, and connect movement to what they actually did or didn't do — only where the data supports the link. If little has moved or they only have a baseline, say so and say what would create movement. " +
    'Return STRICT JSON: {"summary":"2-3 sentences: the honest story of their progress","wins":[{"title":"short","detail":"specific, with the number"}],"slips":[{"title":"short","detail":"what stalled and the likely reason"}],"next":[{"title":"a specific step","detail":"why it will move the needle"}]}. ' +
    "1-3 wins, 0-3 slips, exactly 3 next steps. Never invent numbers.",
  ask: "Read my progress.",
  shape: (o) => {
    const summary = text(o.summary);
    if (!summary) return null;
    return { summary, wins: cleanList(o.wins, 3, ["title", "detail"]), slips: cleanList(o.slips, 3, ["title", "detail"]), next: cleanList(o.next, 3, ["title", "detail"]) };
  },
});
