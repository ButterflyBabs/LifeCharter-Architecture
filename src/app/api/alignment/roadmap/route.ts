import { insightRoute, text } from "@/lib/ai/insightRoute";
import { cleanList } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

const AREA_HREF: Record<string, string> = {
  business: "/business-plan", marketing: "/marketing-plan", sales: "/sales", forecasting: "/planning/forecast",
  finance: "/finance", operations: "/operations", assessments: "/assessments", tasks: "/", content: "/daily-compass/calendar", segments: "/segments",
  goals: "/planning/goals", review: "/planning/review", legal: "/compliance",
};

// The Growth Roadmap on Business Alignment: the client's priority areas, in order, and a 90-day
// plan in three phases built from their own scores, assessment answers, plans, income, pipeline
// and tasks. Each step can be added straight to their task list. Stored with the account, like
// the briefing, and refreshed on request.
export const { GET, POST } = insightRoute({
  area: "roadmap",
  role: "the client's growth coach, turning their Business Alignment results into a 90-day roadmap.",
  rules:
    "Build their personalized Growth Roadmap from their own scores, assessment answers, plans, income, pipeline and tasks above. Start from where they are weakest, but name one strength to build on so it is not all gaps. Keep the steps realistic for one busy founder. " +
    'Return STRICT JSON: {"summary":"2-3 sentences: where they stand and the shape of the next 90 days","priorities":[{"area":"the dimension name","why":"what in THEIR situation puts it first"}],' +
    '"phases":[{"when":"Days 1-30","theme":"a short theme","steps":[{"area":"business|marketing|sales|forecasting|finance|operations|assessments|content|segments|goals|review|legal","title":"a specific step","why":"one sentence tied to their data","task":"the same step as a short to-do (under 80 chars)"}]}]}. ' +
    "Exactly 3 priorities in order, then exactly 3 phases (Days 1-30, Days 31-60, Days 61-90) each with 2 or 3 steps, each phase building on the one before. If they have barely answered anything, say so kindly and make the steps the best first moves. Never invent.",
  ask: "Build my Growth Roadmap.",
  maxTokens: 1900,
  shape: (o) => {
    const summary = text(o.summary);
    if (!summary) return null;
    const phases = (Array.isArray(o.phases) ? o.phases : []).slice(0, 3).map((p) => {
      const ph = p as Record<string, unknown>;
      return {
        when: text(ph.when, 40),
        theme: text(ph.theme, 120),
        steps: cleanList(ph.steps, 3, ["area", "title", "why", "task"]).map((s) => ({ ...s, href: AREA_HREF[s.area] || "/business-alignment" })),
      };
    }).filter((p) => p.steps.length);
    if (!phases.length) return null;
    return { summary, priorities: cleanList(o.priorities, 3, ["area", "why"]), phases };
  },
});
