"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CornerDownRight, Flag, Trash2 } from "lucide-react";
import { useCommunity, useProfiles } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import type { Comment, Post, Reaction } from "@/lib/community/types";
import { PostCard, ReactionBar } from "@/components/community/Feed";
import { Avatar, Button, Card, EmptyState, ErrorNote, PageLoading, RichText } from "@/components/community/ui";
import { AttachButton, DraftStrip, MediaGallery, pasteInto, useMediaDraft } from "@/components/community/Media";
import { MentionTextArea, useMentions } from "@/components/community/MentionTextArea";
import { ReportDialog } from "@/components/community/ReportDialog";

export default function PostPage({ params }: { params: { id: string } }) {
  const { supabase, channels, spaces } = useCommunity();
  const router = useRouter();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [postReactions, setPostReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReactions, setCommentReactions] = useState<Record<string, Reaction[]>>({});

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from("cm_posts").select("*").eq("id", params.id).is("deleted_at", null).maybeSingle(),
      supabase.from("cm_comments").select("*").eq("post_id", params.id).is("deleted_at", null).order("created_at"),
    ]);
    setPost((p.data as Post) ?? null);
    const list = (c.data as Comment[]) ?? [];
    setComments(list);
    const { data: r } = await supabase
      .from("cm_reactions")
      .select("*")
      .or([`post_id.eq.${params.id}`, list.length ? `comment_id.in.(${list.map((x) => x.id).join(",")})` : ""].filter(Boolean).join(","));
    const all = (r as Reaction[]) ?? [];
    setPostReactions(all.filter((x) => x.post_id === params.id));
    const byComment: Record<string, Reaction[]> = {};
    for (const x of all) if (x.comment_id) (byComment[x.comment_id] ||= []).push(x);
    setCommentReactions(byComment);
  }, [supabase, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const sub = supabase
      .channel(`cm-comments-${params.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cm_comments", filter: `post_id=eq.${params.id}` }, (payload: { new: unknown }) => {
        const c = payload.new as Comment;
        setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [supabase, params.id]);

  if (post === undefined) return <PageLoading />;
  if (post === null) {
    return (
      <EmptyState icon="🕊️" title="This post isn't available">
        It may have been removed. <Link href="/community" className="underline">Back to Home</Link>
      </EmptyState>
    );
  }

  const channel = channels.find((c) => c.id === post.channel_id);
  const space = spaces.find((s) => s.id === post.space_id);
  const top = comments.filter((c) => !c.parent_id);
  const replies = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--cm-muted-2)] hover:text-[var(--cm-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PostCard
        post={post}
        full
        reactions={postReactions}
        onReactions={setPostReactions}
        onChanged={setPost}
        onDeleted={() => router.push(space && channel ? `/community/s/${space.slug}/${channel.slug}` : "/community")}
        channelLabel={space && channel ? { name: channel.name, emoji: channel.emoji, href: `/community/s/${space.slug}/${channel.slug}` } : undefined}
      />

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 font-display text-[21px] font-semibold text-[var(--cm-ink)]">
          {comments.length ? `${comments.length} ${comments.length === 1 ? "reply" : "replies"}` : "Replies"}
        </h2>
        <div className="space-y-4">
          {top.map((c) => (
            <div key={c.id}>
              <CommentRow
                comment={c}
                reactions={commentReactions[c.id] ?? []}
                onReactions={(r) => setCommentReactions((p) => ({ ...p, [c.id]: r }))}
                onDeleted={(id) => setComments((prev) => prev.filter((x) => x.id !== id))}
                replyBox={<ReplyBox postId={post.id} parentId={c.id} compact onPosted={(n) => setComments((p) => [...p.filter((x) => x.id !== n.id), n])} />}
              />
              {replies(c.id).length > 0 && (
                <div className="ml-11 mt-3 space-y-3 border-l-2 border-[var(--cm-line-soft)] pl-4">
                  {replies(c.id).map((r) => (
                    <CommentRow
                      key={r.id}
                      comment={r}
                      reactions={commentReactions[r.id] ?? []}
                      onReactions={(x) => setCommentReactions((p) => ({ ...p, [r.id]: x }))}
                      onDeleted={(id) => setComments((prev) => prev.filter((x) => x.id !== id))}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-[var(--cm-line-soft)] pt-4">
          <ReplyBox postId={post.id} onPosted={(n) => setComments((p) => [...p.filter((x) => x.id !== n.id), n])} />
        </div>
      </Card>
    </div>
  );
}

function CommentRow({
  comment,
  reactions,
  onReactions,
  onDeleted,
  replyBox,
}: {
  comment: Comment;
  reactions: Reaction[];
  onReactions: (r: Reaction[]) => void;
  onDeleted: (id: string) => void;
  replyBox?: React.ReactNode;
}) {
  const { supabase, userId, canModerate } = useCommunity();
  const people = useProfiles([comment.author_id]);
  const author = people[comment.author_id];
  const [replying, setReplying] = useState(false);
  const [reporting, setReporting] = useState(false);
  const canDelete = comment.author_id === userId || canModerate(comment.space_id);

  return (
    <div className="flex gap-3">
      <Link href={`/community/members/${comment.author_id}`}>
        <Avatar name={author?.display_name} url={author?.avatar_url} size={34} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-[var(--cm-fill-2)] px-3.5 py-2.5">
          <p className="text-[13.5px]">
            <Link href={`/community/members/${comment.author_id}`} className="font-semibold text-[var(--cm-ink)] hover:underline">
              {author?.display_name ?? "…"}
            </Link>{" "}
            <span className="text-[12px] text-[var(--cm-muted)]">· {timeAgo(comment.created_at)}</span>
          </p>
          {comment.body && <RichText text={comment.body} className="text-[14.5px]" />}
          <MediaGallery items={comment.attachments} compact />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 pl-1">
          <ReactionBar target={{ comment_id: comment.id }} reactions={reactions} onChange={onReactions} />
          {replyBox && (
            <button onClick={() => setReplying((v) => !v)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--cm-muted-2)] hover:text-[var(--cm-ink)]">
              <CornerDownRight className="h-3.5 w-3.5" /> Reply
            </button>
          )}
          {canDelete && (
            <button
              onClick={async () => {
                if (!confirm("Delete this reply?")) return;
                const { error } = await supabase.from("cm_comments").update({ deleted_at: new Date().toISOString() }).eq("id", comment.id);
                if (!error) onDeleted(comment.id);
              }}
              aria-label="Delete reply"
              className="text-[var(--cm-faint)] hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {comment.author_id !== userId && (
            <button onClick={() => setReporting(true)} aria-label="Report reply" title="Report" className="text-[var(--cm-faint)] hover:text-[var(--cm-ink)]">
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {replying && replyBox && <div className="mt-2">{replyBox}</div>}
        {reporting && <ReportDialog target={{ type: "comment", id: comment.id, userId: comment.author_id, userName: author?.display_name }} onClose={() => setReporting(false)} />}
      </div>
    </div>
  );
}

function ReplyBox({ postId, parentId, compact, onPosted }: { postId: string; parentId?: string; compact?: boolean; onPosted: (c: Comment) => void }) {
  const { supabase, userId, profile } = useCommunity();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const media = useMediaDraft();
  const mentions = useMentions();
  const ready = !!text.trim() || media.items.length > 0;
  async function send() {
    if (!ready || !userId) return;
    setBusy(true);
    setError(null);
    try {
      const attachments = await media.upload(userId);
      const { data, error } = await supabase
        .from("cm_comments")
        .insert({ post_id: postId, parent_id: parentId ?? null, author_id: userId, body: mentions.encode(text.trim()), attachments })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      onPosted(data as Comment);
      setText("");
      media.clear();
      mentions.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send your reply.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex gap-3">
      {!compact && <Avatar name={profile?.display_name} url={profile?.avatar_url} size={34} />}
      <div className="flex-1 space-y-2">
        <MentionTextArea
          value={text}
          onValueChange={setText}
          mentions={mentions}
          onPaste={pasteInto(media)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
          }}
          placeholder={parentId ? "Write a reply…" : "Add to the conversation…"}
          className="min-h-[64px]"
          rows={2}
        />
        <DraftStrip draft={media} size={64} />
        <ErrorNote>{error}</ErrorNote>
        <div className="flex items-center justify-between">
          <AttachButton draft={media} accept="image/*,video/*" />
          <Button size="sm" variant="gold" disabled={busy || !ready} onClick={send}>
            {busy ? media.progress ?? "Sending…" : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
