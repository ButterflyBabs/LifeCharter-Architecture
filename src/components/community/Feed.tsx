"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageSquare, MoreHorizontal, Pin, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity, useProfiles } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import type { Channel, Post, Reaction } from "@/lib/community/types";
import { AttachButton, DraftStrip, LinkEmbed, MediaGallery, pasteInto, useMediaDraft } from "./Media";
import { MentionTextArea, useMentions } from "./MentionTextArea";
import { decodeMentions, toPlain } from "@/lib/community/mentions";
import { Avatar, Badge, Button, Card, ErrorNote, RichText, Input, EmptyState, Spinner } from "./ui";

export const REACTIONS = ["❤️", "🙌", "🔥", "🦋", "👏", "💡"];

// ─── Composer ──────────────────────────────────────────────────────────────

export function Composer({ channel, onPosted }: { channel: Channel; onPosted: (p: Post) => void }) {
  const { supabase, userId, profile, canModerate } = useCommunity();
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const media = useMediaDraft();
  const mentions = useMentions();
  const isAnnouncement = channel.kind === "announcements";

  if (channel.post_policy === "moderators" && !canModerate(channel.space_id)) return null;

  const hasMedia = media.items.length > 0;
  async function submit() {
    if (!userId || (!body.trim() && !hasMedia)) return;
    setBusy(true);
    setError(null);
    try {
      const attachments = await media.upload(userId);
      const { data, error } = await supabase
        .from("cm_posts")
        .insert({
          channel_id: channel.id,
          space_id: channel.space_id,
          author_id: userId,
          title: title.trim() || null,
          body: mentions.encode(body.trim()),
          attachments,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      onPosted(data as Post);
      setBody("");
      setTitle("");
      media.clear();
      mentions.reset();
      setFocused(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const expanded = focused || body.length > 0 || hasMedia;
  const placeholder = channel.prompt || (isAnnouncement ? "Share an update…" : "Share with the Collective…");

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar name={profile?.display_name} url={profile?.avatar_url} size={40} />
        <div className="min-w-0 flex-1 space-y-2.5">
          {expanded && isAnnouncement && <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />}
          {expanded ? (
            <MentionTextArea
              autoFocus
              value={body}
              onValueChange={setBody}
              mentions={mentions}
              onPaste={pasteInto(media)}
              placeholder={`${placeholder}  (Type @ to tag someone.)`}
              className="min-h-[110px]"
              rows={4}
            />
          ) : (
            <button
              type="button"
              onClick={() => setFocused(true)}
              className="block w-full truncate rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3.5 py-2.5 text-left text-[15px] text-[var(--cm-faint)] transition hover:border-[#D4AF63]"
            >
              {placeholder}
            </button>
          )}
          <DraftStrip draft={media} />
          <ErrorNote>{error}</ErrorNote>
          <div className="flex items-center justify-between gap-2">
            <AttachButton draft={media} />
            {expanded && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setFocused(false); setBody(""); setTitle(""); media.clear(); }}>
                  Cancel
                </Button>
                <Button variant="gold" size="sm" disabled={busy || (!body.trim() && !hasMedia)} onClick={submit}>
                  {busy ? media.progress ?? "Posting…" : "Post"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Reactions ─────────────────────────────────────────────────────────────

export function ReactionBar({
  target,
  reactions,
  onChange,
}: {
  target: { post_id?: string; comment_id?: string };
  reactions: Reaction[];
  onChange: (next: Reaction[]) => void;
}) {
  const { supabase, userId } = useCommunity();
  const [picker, setPicker] = useState(false);
  const counts = REACTIONS.map((e) => ({ emoji: e, n: reactions.filter((r) => r.emoji === e).length, mine: reactions.find((r) => r.emoji === e && r.user_id === userId) }))
    .filter((x) => x.n > 0);

  async function toggle(emoji: string) {
    setPicker(false);
    if (!userId) return;
    const mine = reactions.find((r) => r.emoji === emoji && r.user_id === userId);
    if (mine) {
      onChange(reactions.filter((r) => r.id !== mine.id));
      await supabase.from("cm_reactions").delete().eq("id", mine.id);
    } else {
      const temp: Reaction = { id: `tmp-${Math.random()}`, post_id: target.post_id ?? null, comment_id: target.comment_id ?? null, user_id: userId, emoji };
      onChange([...reactions, temp]);
      const { data } = await supabase.from("cm_reactions").insert({ ...target, user_id: userId, emoji }).select("*").single();
      if (data) onChange([...reactions.filter((r) => r.id !== temp.id), data as Reaction]);
    }
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {counts.map((c) => (
        <button
          key={c.emoji}
          onClick={() => toggle(c.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] transition",
            c.mine ? "border-[#D4AF63] bg-[var(--cm-gold-soft)] text-[var(--cm-ink)]" : "border-[var(--cm-line)] bg-[var(--cm-surface)] text-[var(--cm-muted-2)] hover:border-[#D4AF63]"
          )}
        >
          <span>{c.emoji}</span>
          <span className="font-semibold">{c.n}</span>
        </button>
      ))}
      <button
        onClick={() => setPicker((v) => !v)}
        aria-label="Add reaction"
        className="inline-flex h-7 items-center rounded-full border border-dashed border-[var(--cm-line-strong)] px-2 text-[13px] text-[var(--cm-muted)] hover:border-[#D4AF63] hover:text-[var(--cm-ink)]"
      >
        ＋☺
      </button>
      {picker && (
        <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-1 rounded-full border border-[var(--cm-line)] bg-[var(--cm-surface)] px-2 py-1 shadow-lg">
          {REACTIONS.map((e) => (
            <button key={e} onClick={() => toggle(e)} className="rounded-full p-1 text-[18px] transition hover:scale-125">
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post card ─────────────────────────────────────────────────────────────

export function PostCard({
  post,
  reactions,
  onReactions,
  onChanged,
  onDeleted,
  channelLabel,
  full,
  tint,
}: {
  post: Post;
  reactions: Reaction[];
  onReactions: (r: Reaction[]) => void;
  onChanged: (p: Post) => void;
  onDeleted: (id: string) => void;
  channelLabel?: { name: string; emoji: string | null; href: string };
  full?: boolean;
  tint?: string; // "r, g, b" — program posts get a soft wash in the Home feed
}) {
  const { supabase, userId, canModerate } = useCommunity();
  const authors = useProfiles([post.author_id]);
  const author = authors[post.author_id];
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const editMentions = useMentions(post.body);
  const [draft, setDraft] = useState(() => decodeMentions(post.body).text);
  const [expanded, setExpanded] = useState(!!full);
  const mod = canModerate(post.space_id);
  const mine = post.author_id === userId;
  const long = post.body.length > 600;

  async function save() {
    const { data, error } = await supabase.from("cm_posts").update({ body: editMentions.encode(draft) }).eq("id", post.id).select("*").single();
    if (!error && data) onChanged(data as Post);
    setEditing(false);
  }
  async function remove() {
    setMenu(false);
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("cm_posts").update({ deleted_at: new Date().toISOString() }).eq("id", post.id);
    if (!error) onDeleted(post.id);
  }
  async function togglePin() {
    setMenu(false);
    const { data } = await supabase.from("cm_posts").update({ pinned: !post.pinned }).eq("id", post.id).select("*").single();
    if (data) onChanged(data as Post);
  }

  return (
    <Card
      as="article"
      className="p-4 sm:p-5"
      style={
        tint
          ? { backgroundImage: `linear-gradient(rgba(${tint}, 0.08), rgba(${tint}, 0.08))`, borderColor: `rgba(${tint}, 0.35)` }
          : undefined
      }
    >
      <header className="flex items-start gap-3">
        <Link href={`/community/members/${post.author_id}`}>
          <Avatar name={author?.display_name} url={author?.avatar_url} size={42} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link href={`/community/members/${post.author_id}`} className="font-semibold text-[var(--cm-ink)] hover:underline">
              {author?.display_name ?? "…"}
            </Link>
            {post.pinned && (
              <Badge>
                <Pin className="h-3 w-3" /> Pinned
              </Badge>
            )}
          </div>
          <p className="text-[12.5px] text-[var(--cm-muted)]">
            {channelLabel && (
              <>
                <Link href={channelLabel.href} className="inline-flex items-center gap-1 hover:text-[var(--cm-ink)]">
                  {tint && <span className="inline-block h-2 w-2 rounded-full" style={{ background: `rgb(${tint})` }} aria-hidden />}
                  {channelLabel.emoji} {channelLabel.name}
                </Link>{" "}
                ·{" "}
              </>
            )}
            <Link href={`/community/post/${post.id}`} className="hover:text-[var(--cm-ink)]">
              {timeAgo(post.created_at)}
            </Link>
            {post.edited_at && " · edited"}
          </p>
        </div>
        {(mine || mod) && (
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} aria-label="Post options" className="rounded-lg p-1.5 text-[var(--cm-muted)] hover:bg-black/5">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menu && (
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-[var(--cm-line)] bg-[var(--cm-surface)] py-1 text-[14px] shadow-lg">
                {mine && (
                  <button onClick={() => { setMenu(false); setEditing(true); }} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[var(--cm-fill)]">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                )}
                {mod && (
                  <button onClick={togglePin} className="flex w-full items-center gap-2 px-3 py-2 hover:bg-[var(--cm-fill)]">
                    <Pin className="h-4 w-4" /> {post.pinned ? "Unpin" : "Pin to top"}
                  </button>
                )}
                <button onClick={remove} className="flex w-full items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="mt-3">
        {post.title && <h2 className="mb-1.5 font-display text-[22px] font-semibold leading-snug text-[var(--cm-ink)]">{post.title}</h2>}
        {editing ? (
          <div className="space-y-2">
            <MentionTextArea value={draft} onValueChange={setDraft} mentions={editMentions} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={save}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <RichText text={long && !expanded ? toPlain(post.body).slice(0, 560).trimEnd() + "…" : post.body} />
            {long && !expanded && (
              <button onClick={() => setExpanded(true)} className="mt-1 text-[13.5px] font-semibold text-[var(--cm-gold-text)] hover:underline">
                Read more
              </button>
            )}
          </>
        )}
        <MediaGallery items={post.attachments} />
        {!post.attachments?.some((x) => x.type?.startsWith("video/")) && <LinkEmbed text={post.body} />}
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cm-line-soft)] pt-3">
        <ReactionBar target={{ post_id: post.id }} reactions={reactions} onChange={onReactions} />
        {!full && (
          <Link href={`/community/post/${post.id}`} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--cm-muted-2)] hover:text-[var(--cm-ink)]">
            <MessageSquare className="h-4 w-4" />
            {post.comment_count > 0 ? `${post.comment_count} ${post.comment_count === 1 ? "reply" : "replies"}` : "Reply"}
          </Link>
        )}
      </footer>
    </Card>
  );
}

// ─── Channel feed ──────────────────────────────────────────────────────────

const PAGE = 20;

export function ChannelFeed({ channel }: { channel: Channel }) {
  const { supabase } = useCommunity();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);

  const loadReactions = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      const { data } = await supabase.from("cm_reactions").select("*").in("post_id", ids);
      const grouped: Record<string, Reaction[]> = {};
      for (const r of (data as Reaction[]) ?? []) (grouped[r.post_id!] ||= []).push(r);
      setReactions((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, grouped[id] ?? []])) }));
    },
    [supabase]
  );

  const load = useCallback(
    async (before?: string) => {
      let q = supabase
        .from("cm_posts")
        .select("*")
        .eq("channel_id", channel.id)
        .is("deleted_at", null)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (before) q = q.eq("pinned", false).lt("created_at", before);
      const { data } = await q;
      const rows = (data as Post[]) ?? [];
      setPosts((prev) => (before ? [...prev, ...rows] : rows));
      setMore(rows.length === PAGE);
      setLoading(false);
      void loadReactions(rows.map((p) => p.id));
    },
    [supabase, channel.id, loadReactions]
  );

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // New posts from others appear live.
  useEffect(() => {
    const sub = supabase
      .channel(`cm-posts-${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cm_posts", filter: `channel_id=eq.${channel.id}` }, (payload: { new: unknown }) => {
        const p = payload.new as Post;
        setPosts((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [supabase, channel.id]);

  return (
    <div className="space-y-4">
      <Composer channel={channel} onPosted={(p) => setPosts((prev) => [p, ...prev.filter((x) => x.id !== p.id)])} />
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-7 w-7" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={channel.emoji ?? "✨"} title="Nothing here yet">
          {channel.post_policy === "moderators" ? "Updates will appear here." : "Be the first to share."}
        </EmptyState>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            reactions={reactions[p.id] ?? []}
            onReactions={(r) => setReactions((prev) => ({ ...prev, [p.id]: r }))}
            onChanged={(np) => setPosts((prev) => prev.map((x) => (x.id === np.id ? np : x)))}
            onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
          />
        ))
      )}
      {more && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => load(posts.filter((p) => !p.pinned).at(-1)?.created_at)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
