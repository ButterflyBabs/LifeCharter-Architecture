import { insightRoute, text } from "@/lib/ai/insightRoute";
import { cleanList } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

// The Segment read: how their businesses and segments compare — where the
// revenue sits against targets, where it's concentrated, what's under-served —
// and where to put attention. Uses only the segments this client set up.
export const { GET, POST } = insightRoute({
  area: "segments",
  role: "the client's portfolio advisor, comparing their businesses and segments.",
  rules:
    "Look at their businesses and segments above — each segment's alignment score is built from the income, tasks, goals and sales tied to it (with the business-wide score as the anchor), so a low score points at real work to do; say which segments are improving and which are slipping, and if a segment's score is only the business-wide one because nothing is tagged to it, say that plainly and tell them what to tag. Also weigh this month's revenue against targets, how concentrated revenue is, which segments have no revenue or target recorded, and how each fits their plans, pipeline and weakest alignment areas. Recommend where to put attention and what to record so the picture is complete. If they have no segments yet, explain in one line why setting them up helps and suggest a first structure based on what you know of their business. " +
    'Return STRICT JSON: {"summary":"2-3 sentences: the honest picture across their businesses","focus":[{"title":"segment or business","detail":"why it deserves attention now"}],"risks":[{"title":"short","detail":"e.g. concentration, a segment with no revenue tracked"}],"next":[{"title":"a specific step","detail":"why"}]}. ' +
    "1-3 focus items, 0-3 risks, exactly 3 next steps. Never invent numbers or segments.",
  ask: "Read my businesses and segments.",
  shape: (o) => {
    const summary = text(o.summary);
    if (!summary) return null;
    return { summary, focus: cleanList(o.focus, 3, ["title", "detail"]), risks: cleanList(o.risks, 3, ["title", "detail"]), next: cleanList(o.next, 3, ["title", "detail"]) };
  },
});
