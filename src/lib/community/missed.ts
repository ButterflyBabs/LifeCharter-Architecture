// Server-only: "What you missed" — new posts and replies in the member's own
// channels since a given time. Everything is read through the member's own
// session (memberSupabase), so RLS decides what they can see.
import type { MemberDb } from "./memberDb";
import { toPlain } from "./mentions";

export interface MissedThread {
  postId: string;
  title: string;
  isNewPost: boolean;
  newReplies: number;
  channel: { name: string; emoji: string | null };
  pathway: string;
  href: string;
  lastAt: string;
  // For the AI summary only (never sent to the browser).
  body: string;
  replies: { author: string; text: string }[];
  author: string;
}

export interface Missed {
  since: string;
  newPosts: number;
  newReplies: number;
  threads: MissedThread[];
}

const flat = (s: string | null | undefined) => toPlain(s).replace(/\s+/g, " ").trim();
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

interface PostRow {
  id: string;
  title: string | null;
  body: string;
  space_id: string;
  channel_id: string;
  author_id: string;
  created_at: string;
}
interface CommentRow {
  id: string;
  post_id: string;
  body: string;
  author_id: string;
  created_at: string;
}

export async function gatherMissed(db: MemberDb, userId: string, since: string): Promise<Missed> {
  const empty: Missed = { since, newPosts: 0, newReplies: 0, threads: [] };
  const { data: mem } = await db.from("cm_space_members").select("space_id").eq("user_id", userId);
  const spaceIds = ((mem as { space_id: string }[] | null) ?? []).map((m) => m.space_id);
  if (!spaceIds.length) return empty;

  const [{ data: posts }, { data: comments }] = await Promise.all([
    db
      .from("cm_posts")
      .select("id, title, body, space_id, channel_id, author_id, created_at")
      .in("space_id", spaceIds)
      .gt("created_at", since)
      .neq("author_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("cm_comments")
      .select("id, post_id, body, author_id, created_at")
      .in("space_id", spaceIds)
      .gt("created_at", since)
      .neq("author_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);
  const postRows = (posts as PostRow[] | null) ?? [];
  const commentRows = (comments as CommentRow[] | null) ?? [];
  if (!postRows.length && !commentRows.length) return empty;

  // Older posts that got new replies.
  const known = new Set(postRows.map((p) => p.id));
  const extraIds = Array.from(new Set(commentRows.map((c) => c.post_id).filter((id) => !known.has(id)))).slice(0, 20);
  let extra: PostRow[] = [];
  if (extraIds.length) {
    const { data } = await db.from("cm_posts").select("id, title, body, space_id, channel_id, author_id, created_at").in("id", extraIds).is("deleted_at", null);
    extra = (data as PostRow[] | null) ?? [];
  }
  const allPosts = [...postRows, ...extra];

  const [{ data: chans }, { data: spaces }, { data: people }] = await Promise.all([
    db.from("cm_channels").select("id, name, archived").in("id", Array.from(new Set(allPosts.map((p) => p.channel_id)))),
    db.from("cm_spaces").select("id, name, emoji, archived").in("id", Array.from(new Set(allPosts.map((p) => p.space_id)))),
    db
      .from("cm_profiles")
      .select("user_id, display_name")
      .in("user_id", Array.from(new Set([...allPosts.map((p) => p.author_id), ...commentRows.map((c) => c.author_id)])).slice(0, 200)),
  ]);
  const chanBy = new Map(((chans as { id: string; name: string; archived: boolean }[] | null) ?? []).map((c) => [c.id, c]));
  const spaceBy = new Map(((spaces as { id: string; name: string; emoji: string | null; archived: boolean }[] | null) ?? []).map((s) => [s.id, s]));
  const nameBy = new Map(((people as { user_id: string; display_name: string }[] | null) ?? []).map((p) => [p.user_id, p.display_name]));
  const who = (id: string) => nameBy.get(id) ?? "A member";

  const threads: MissedThread[] = [];
  for (const p of allPosts) {
    const ch = chanBy.get(p.channel_id);
    const sp = spaceBy.get(p.space_id);
    if (!ch || !sp || ch.archived || sp.archived) continue;
    const replies = commentRows.filter((c) => c.post_id === p.id);
    const isNewPost = known.has(p.id);
    const body = flat(p.body);
    threads.push({
      postId: p.id,
      title: cut(flat(p.title) || body.split(/(?<=[.!?])\s/)[0] || "A post", 90),
      isNewPost,
      newReplies: replies.length,
      channel: { name: sp.name, emoji: sp.emoji },
      pathway: ch.name,
      href: `/community/post/${p.id}`,
      lastAt: [isNewPost ? p.created_at : "", ...replies.map((r) => r.created_at)].sort().pop() || p.created_at,
      body: cut(body, 500),
      replies: replies
        .slice(0, 6)
        .reverse()
        .map((r) => ({ author: who(r.author_id), text: cut(flat(r.body), 220) })),
      author: who(p.author_id),
    });
  }
  threads.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  const counted = new Set(threads.map((t) => t.postId));
  return {
    since,
    newPosts: threads.filter((t) => t.isNewPost).length,
    newReplies: commentRows.filter((c) => counted.has(c.post_id)).length,
    threads,
  };
}
