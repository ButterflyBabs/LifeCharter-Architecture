import { createServerClient } from "@/lib/supabase/server";
import { getClientKey, listPosts } from "@/lib/postStream";
import { dayInTz } from "@/lib/tz";

// How many posts the client actually published each day, reconciling the two
// places posts live:
//   • the Social Planner (social_posts marked "posted"), and
//   • PostStream itself — posts published there that were never planned in the
//     Content Calendar.
// A planner post that's linked to its PostStream post (poststream_post_id) is
// counted once, not twice. PostStream posts are read with the client's own key;
// if PostStream is slow or unreachable we quietly count the planner alone.

export interface PostCounts {
  byDay: Map<string, number>;
  fromPostStream: Map<string, number>; // the PostStream-only share of byDay
  postStreamChecked: boolean;
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

export async function publishedPostCounts(masterPlanId: string, tz: string, sinceDay: string): Promise<PostCounts> {
  const byDay = new Map<string, number>();
  const fromPostStream = new Map<string, number>();
  const bump = (m: Map<string, number>, day: string, n = 1) => m.set(day, (m.get(day) ?? 0) + n);

  const { data } = await createServerClient()
    .from("social_posts")
    .select("posted_at, planned_date, poststream_post_id")
    .eq("master_plan_id", masterPlanId)
    .eq("status", "posted")
    .gte("planned_date", sinceDay)
    .limit(5000);
  const linked = new Set<string>();
  for (const p of (data ?? []) as { posted_at: string | null; planned_date: string; poststream_post_id: string | null }[]) {
    bump(byDay, p.posted_at ? dayInTz(p.posted_at, tz) : String(p.planned_date).slice(0, 10));
    if (p.poststream_post_id) linked.add(p.poststream_post_id);
  }

  let postStreamChecked = false;
  try {
    const key = await getClientKey();
    if (key) {
      const posts = await withTimeout(listPosts(key, { status: "published" }), 5000, null);
      if (posts) {
        postStreamChecked = true;
        for (const ps of posts) {
          if (!ps.publishedAt || linked.has(ps.id)) continue;
          const day = dayInTz(ps.publishedAt, tz);
          if (day < sinceDay) continue;
          const n = Math.max(1, ps.platforms.length); // one per platform it went to
          bump(byDay, day, n);
          bump(fromPostStream, day, n);
        }
      }
    }
  } catch {
    /* planner-only */
  }
  return { byDay, fromPostStream, postStreamChecked };
}
