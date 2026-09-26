import { insightRoute, text } from "@/lib/ai/insightRoute";
import { cleanList } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

const AREA_HREF: Record<string, string> = {
  business: "/business-plan", marketing: "/marketing-plan", sales: "/sales", forecasting: "/planning/forecast",
  finance: "/finance", operations: "/operations", assessments: "/assessments", tasks: "/", content: "/daily-compass/calendar", segments: "/segments",
};

// The Business Alignment briefing: what their score and phase mean, what is
// driving the weakest areas (in their own situation), and three specific moves —
// each can be added straight to their task list.
export const { GET, POST } = insightRoute({
  area: "alignment",
  role: "the client's alignment coach, explaining their Business Alignment score.",
  rules:
    "Explain what their overall score and growth phase mean for THEM, then what is actually driving their weakest dimensions — using their own assessment answers, plans, income, pipeline and tasks above. Say where they're strong so it isn't all gaps. " +
    'Return STRICT JSON: {"summary":"2-3 sentences: where they truly stand and why","drivers":[{"title":"the dimension or theme","detail":"what in THEIR situation is pulling it down or holding it up"}],' +
    '"moves":[{"area":"business|marketing|sales|forecasting|finance|operations|assessments|content|segments","title":"a specific next step","why":"one sentence tied to their data","task":"the same step as a short to-do (under 80 chars)"}]}. ' +
    "2-4 drivers, exactly 3 moves in priority order. If they've barely answered anything, say so kindly and make the moves the best first steps. Never invent.",
  ask: "Give me my alignment briefing.",
  shape: (o) => {
    const summary = text(o.summary);
    if (!summary) return null;
    return {
      summary,
      drivers: cleanList(o.drivers, 4, ["title", "detail"]),
      moves: cleanList(o.moves, 3, ["area", "title", "why", "task"]).map((m) => ({ ...m, href: AREA_HREF[m.area] || "/business-alignment" })),
    };
  },
});
