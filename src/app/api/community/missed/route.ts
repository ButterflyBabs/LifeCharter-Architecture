import { NextResponse } from "next/server";
import { memberSupabase } from "@/lib/community/memberDb";
import { gatherMissed } from "@/lib/community/missed";

export const dynamic = "force-dynamic";

// "What you missed" on Collective Home (no AI — free for everyone): marks this
// visit and lists new posts/replies in the member's channels since their
// previous visit, read through their own session (RLS). The AI catch-up is
// POST /api/community/member-ai { action: "missed" }.
export async function GET() {
  const db = memberSupabase();
  if (!db) return NextResponse.json({ threads: [] });
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { data: since } = await db.rpc("cm_touch_visit");
  if (typeof since !== "string") return NextResponse.json({ threads: [] });
  const missed = await gatherMissed(db, user.id, since);
  return NextResponse.json(
    {
      since: missed.since,
      newPosts: missed.newPosts,
      newReplies: missed.newReplies,
      threads: missed.threads.slice(0, 8).map((t) => ({
        postId: t.postId,
        title: t.title,
        isNewPost: t.isNewPost,
        newReplies: t.newReplies,
        channel: t.channel,
        pathway: t.pathway,
        href: t.href,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
