import { insightRoute, text } from "@/lib/ai/insightRoute";
import { cleanList } from "@/lib/ai/planningAi";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The social-proof read: what their clients actually say, in their own words.
// It reads this client's own approved reviews and finds the themes, the lines
// worth using in marketing, and what proof is missing.
export const { GET, POST } = insightRoute({
  area: "reviews",
  role: "the client's marketing partner, reading what their clients say about them.",
  rules:
    "Read the reviews given (each is a real client's words). Find what clients consistently value, the exact lines strongest for marketing (quote them word for word and say who), and what proof is missing (no video, few reviews for an offer, nothing recent). Tie it to their Marketing Plan and offers above where you can. " +
    'Return STRICT JSON: {"summary":"2-3 sentences: what clients say about working with them","themes":[{"title":"a theme","detail":"how it shows up in their words"}],"quotes":[{"title":"the exact line","detail":"who said it and where to use it"}],"gaps":[{"title":"short","detail":"what proof is missing"}],"next":[{"title":"a specific step","detail":"why"}]}. ' +
    "2-4 themes, 2-3 quotes (verbatim from the reviews given only), 1-3 gaps, exactly 3 next steps. If there are no reviews yet, say so kindly, leave themes and quotes empty, and make the next steps how to collect the first ones. Never invent a quote.",
  ask: async (planId) => {
    const { data } = await createServerClient()
      .from("testimonials")
      .select("client_name, program, rating, headline, content, status, type, created_at")
      .eq("master_plan_id", planId)
      .in("status", ["approved", "featured"])
      .order("created_at", { ascending: false })
      .limit(40);
    const rows = (data ?? []) as { client_name: string; program: string; rating: number | null; headline: string; content: string; type: string; created_at: string }[];
    return rows.length
      ? "Their approved reviews:\n" + rows.map((r) => `- ${r.client_name}${r.program ? ` (${r.program})` : ""}${r.rating ? `, ${r.rating}/5` : ""}, ${r.type}, ${r.created_at.slice(0, 10)}: ${r.headline ? `"${r.headline}" — ` : ""}${r.content.slice(0, 500)}`).join("\n")
      : "They have no approved reviews yet.";
  },
  shape: (o) => {
    const summary = text(o.summary);
    if (!summary) return null;
    return { summary, themes: cleanList(o.themes, 4, ["title", "detail"]), quotes: cleanList(o.quotes, 3, ["title", "detail"]), gaps: cleanList(o.gaps, 3, ["title", "detail"]), next: cleanList(o.next, 3, ["title", "detail"]) };
  },
});
