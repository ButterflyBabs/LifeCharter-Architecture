import { createServerClient } from "@/lib/supabase/server";

// Help answers Babs approved from resolved tickets (Support Desk > Help ideas). Returned for a question so the
// assistant can use them next to the built-in Help library. Cheap keyword overlap; at most 3.
const STOP = new Set("the a an and or of to for in on with is are do does how can i my me you your it this that what where when why be not from at by as if".split(" "));
const words = (s: string) => (s.toLowerCase().match(/[a-z][a-z']{2,}/g) ?? []).filter((w) => !STOP.has(w));

export async function approvedHelpFor(message: string): Promise<{ question: string; answer: string }[]> {
  try {
    const { data } = await createServerClient().from("help_suggestions").select("question, answer").eq("status", "approved").limit(200);
    const q = new Set(words(message));
    if (!q.size) return [];
    return ((data ?? []) as { question: string; answer: string }[])
      .map((r) => ({ r, score: words(`${r.question} ${r.answer}`).filter((w) => q.has(w)).length }))
      .filter((x) => x.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.r);
  } catch {
    return [];
  }
}
