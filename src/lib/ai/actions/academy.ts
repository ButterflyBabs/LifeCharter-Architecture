import type { ActionCtx, ActionTool } from "./types";
import { ACADEMY_LESSONS } from "@/content/academy";
import { creditedByDimension, pathFor, releasedLessons, reviewState, wingsFor } from "@/lib/academy/rules";
import { DIMENSION_LABEL, type DimensionKey } from "@/lib/scoring/dimensionModel";

// The assistant's look at LCCS Academy. Read only: it can encourage and point the way, but the learning stays theirs,
// so it never takes a quiz, writes a try-it answer or marks a lesson done.
async function released(ctx: ActionCtx) {
  const { data } = await ctx.db.from("academy_lesson_reviews").select("lesson_id, status, note, content_hash");
  const rows = new Map(((data || []) as { lesson_id: string; status: string; note: string | null; content_hash: string | null }[]).map((r) => [r.lesson_id, r]));
  return releasedLessons(ACADEMY_LESSONS, new Map(ACADEMY_LESSONS.map((l) => [l.id, reviewState(l, rows.get(l.id))])));
}

export const academyProgress: ActionTool = {
  name: "academy_progress",
  kind: "read",
  apiPath: "/api/academy",
  description: "See LCCS Academy progress in this account: each person's lessons passed, Wings, the next lesson, and which health scores their work has lifted. Use it when they ask about their training, what to learn next, or their Wings. Read only: never take a quiz, answer a try-it or mark a lesson done for them.",
  parameters: { type: "object", properties: {} },
  read: async (_a, ctx) => {
    const [{ data: progress }, { data: answers }, lessons] = await Promise.all([
      ctx.db.from("academy_progress").select("user_id, lesson_id, name, best_score, attempts, passed_at").eq("master_plan_id", ctx.planId),
      ctx.db.from("academy_answers").select("user_id, lesson_id").eq("master_plan_id", ctx.planId),
      released(ctx),
    ]);
    const rows = (progress || []) as { user_id: string; lesson_id: string; name: string | null; best_score: number; attempts: number; passed_at: string | null }[];
    const said = (answers || []) as { user_id: string; lesson_id: string }[];
    if (!rows.length) return "Nobody in this account has started LCCS Academy yet. It is at Getting Started > LCCS Academy, and the first lesson is What the Command Suite measures.";
    const path = pathFor("client", lessons);
    const people = Array.from(new Set(rows.map((r) => r.user_id))).map((id) => {
      const mine = rows.filter((r) => r.user_id === id);
      const passed = new Set(mine.filter((r) => r.passed_at).map((r) => r.lesson_id));
      const next = path.find((l) => !passed.has(l.id));
      const wings = wingsFor(path, mine, new Set(said.filter((a) => a.user_id === id).map((a) => a.lesson_id)));
      return `${mine[0].name || "Someone"}: ${passed.size} lessons passed, ${wings} Wings, next: ${next ? next.title : "nothing, the path is finished"}`;
    });
    const credit = creditedByDimension(lessons, rows.filter((r) => r.passed_at), said);
    const lifts = (Object.entries(credit) as [DimensionKey, number][]).map(([k, n]) => `${DIMENSION_LABEL[k]} (${n} ${n === 1 ? "lesson" : "lessons"})`);
    return `${people.join(". ")}.${lifts.length ? ` Lessons counting toward health scores: ${lifts.join(", ")}. Each moves that score 1.5% of the way toward 100, up to 5%.` : " No lesson counts toward a health score yet: that takes a passed quiz and an answered try-it on a lesson tied to a dimension."}`;
  },
};

export const ACADEMY_TOOLS: ActionTool[] = [academyProgress];
