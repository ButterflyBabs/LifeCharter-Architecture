"use client";

// The settled member's Home feed: a "Share with the Collective" box, then
// posts from Community and the member's own program channels, newest
// activity first, loading more as they scroll and updating live. Program
// posts carry a soft tint of their program's colour; the latest
// announcement from the past week stays pinned on top.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { tintFor } from "@/lib/community/tints";
import type { Channel, Post, Reaction, Space } from "@/lib/community/types";
import { PostCard } from "./Feed";
import { AttachButton, DraftStrip, pasteInto, useMediaDraft } from "./Media";
import { MentionTextArea, useMentions } from "./MentionTextArea";
import { Avatar, Button, Card, EmptyState, ErrorNote, Spinner } from "./ui";

const PAGE = 12;
type Filter = "all" | "community" | "programs";

export function HomeFeed({ spaces, explore }: { spaces: Space[]; explore?: React.ReactNode }) {
  const { supabase, channels } = useCommunity();
  const [filter, setFilter] = useState<Filter>("all");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [pinned, setPinned] = useState<Post | null>(null);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const spaceById = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);
  const programSpaces = spaces.filter((s) => s.slug !== "commons");
  const feedChannels = useMemo(() => {
    const allowed = new Set(
      spaces.filter((s) => (filter === "all" ? true : filter === "community" ? s.slug === "commons" : s.slug !== "commons")).map((s) => s.id)
    );
    return channels.filter((c) => allowed.has(c.space_id));
  }, [channels, spaces, filter]);
  const channelById = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);
  const ids = feedChannels.map((c) => c.id);
  const idsKey = ids.join(",");

  const loadReactions = useCallback(
    async (postIds: string[]) => {
      if (!postIds.length) return;
      const { data } = await supabase.from("cm_reactions").select("*").in("post_id", postIds);
      const grouped: Record<string, Reaction[]> = {};
      for (const r of (data as Reaction[]) ?? []) (grouped[r.post_id!] ||= []).push(r);
      setReactions((prev) => ({ ...prev, ...Object.fromEntries(postIds.map((id) => [id, grouped[id] ?? []])) }));
    },
    [supabase]
  );

  const load = useCallback(
    async (before?: string) => {
      if (!idsKey) {
        setPosts([]);
        return;
      }
      let q = supabase
        .from("cm_posts")
        .select("*")
        .in("channel_id", idsKey.split(","))
        .is("deleted_at", null)
        .order("last_activity_at", { ascending: false })
        .limit(PAGE);
      if (before) q = q.lt("last_activity_at", before);
      const { data } = await q;
      const rows = (data as Post[]) ?? [];
      setPosts((prev) => (before ? [...(prev ?? []), ...rows.filter((r) => !(prev ?? []).some((p) => p.id === r.id))] : rows));
      setMore(rows.length === PAGE);
      void loadReactions(rows.map((p) => p.id));
    },
    [supabase, idsKey, loadReactions]
  );

  // Latest announcement from the past week, pinned on top.
  useEffect(() => {
    const annIds = channels.filter((c) => c.kind === "announcements" && spaceById.has(c.space_id)).map((c) => c.id);
    if (!annIds.length) return setPinned(null);
    void supabase
      .from("cm_posts")
      .select("*")
      .in("channel_id", annIds)
      .is("deleted_at", null)
      .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }: { data: Post[] | null }) => {
        const p = data?.[0] ?? null;
        setPinned(p);
        if (p) void loadReactions([p.id]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, channels.length, spaces.length]);

  useEffect(() => {
    setPosts(null);
    void load();
  }, [load]);

  // New posts appear live.
  useEffect(() => {
    if (!idsKey) return;
    const sub = supabase
      .channel(`cm-home-${idsKey.length}-${filter}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cm_posts", filter: `channel_id=in.(${idsKey})` }, (payload: { new: unknown }) => {
        const p = payload.new as Post;
        setPosts((prev) => (prev && !prev.some((x) => x.id === p.id) ? [p, ...prev] : prev));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(sub);
    };
  }, [supabase, idsKey, filter]);

  // Load more when the bottom comes into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more) return;
    const io = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loadingMore || !posts?.length) return;
      setLoadingMore(true);
      await load(posts[posts.length - 1].last_activity_at);
      setLoadingMore(false);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [more, posts, load, loadingMore]);

  const label = (p: Post) => {
    const c = channelById.get(p.channel_id);
    const s = spaceById.get(p.space_id);
    if (!c || !s) return undefined;
    const name = s.slug === "commons" ? c.name : `${s.name} · ${c.name}`;
    return { name, emoji: c.emoji, href: `/community/s/${s.slug}/${c.slug}` };
  };
  const tint = (p: Post) => {
    const s = spaceById.get(p.space_id);
    return s && s.slug !== "commons" ? tintFor(s.slug) : undefined;
  };
  const shown = (posts ?? []).filter((p) => p.id !== pinned?.id);

  const card = (p: Post, isPinned = false) => (
    <div key={p.id} className="space-y-1">
      {isPinned && <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">📣 Announcement</p>}
      <PostCard
        post={p}
        reactions={reactions[p.id] ?? []}
        onReactions={(r) => setReactions((prev) => ({ ...prev, [p.id]: r }))}
        onChanged={(np) => (isPinned ? setPinned(np) : setPosts((prev) => (prev ?? []).map((x) => (x.id === np.id ? np : x))))}
        onDeleted={(id) => (isPinned ? setPinned(null) : setPosts((prev) => (prev ?? []).filter((x) => x.id !== id)))}
        channelLabel={label(p)}
        tint={tint(p)}
      />
    </div>
  );

  return (
    <section aria-label="Community feed" className="space-y-4">
      <HomeComposer spaces={spaces} onPosted={(p) => setPosts((prev) => [p, ...(prev ?? []).filter((x) => x.id !== p.id)])} />

      {programSpaces.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show posts from">
          {(
            [
              ["all", "All"],
              ["community", "Community"],
              ["programs", "My programs"],
            ] as [Filter, string][]
          ).map(([f, name]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "rounded-full border px-3 py-1 text-[13px] font-semibold transition",
                filter === f
                  ? "border-[var(--cm-ink)] bg-[var(--cm-navy)] text-white"
                  : "border-[var(--cm-line-strong)] bg-[var(--cm-surface)] text-[var(--cm-ink)] hover:border-[#D4AF63]"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {pinned && filter !== "programs" && card(pinned, true)}

      {posts === null ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-7 w-7" />
        </div>
      ) : shown.length === 0 ? (
        <EmptyState icon="🌱" title="The conversation starts here">
          Be the first to share a win, ask a question or say hello.
        </EmptyState>
      ) : (
        shown.map((p, i) => (
          <div key={p.id} className="space-y-4">
            {card(p)}
            {i === 4 && explore}
          </div>
        ))
      )}
      {posts && shown.length > 0 && shown.length <= 4 && explore}
      <div ref={sentinel} />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </section>
  );
}

// ─── Share with the Collective ─────────────────────────────────────────────

function HomeComposer({ spaces, onPosted }: { spaces: Space[]; onPosted: (p: Post) => void }) {
  const { supabase, userId, profile, channels, canModerate } = useCommunity();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const media = useMediaDraft();
  const mentions = useMentions();

  // Pathways this member can post in, Community first.
  const options = useMemo(() => {
    const order = new Map(spaces.map((s, i) => [s.id, s.slug === "commons" ? -1 : i]));
    return channels
      .filter((c) => order.has(c.space_id) && (c.post_policy === "members" || canModerate(c.space_id)))
      .sort((a, b) => (order.get(a.space_id)! - order.get(b.space_id)!) || a.sort_order - b.sort_order);
  }, [channels, spaces, canModerate]);
  const defaultId = options.find((c) => c.slug === "wins" && spaces.find((s) => s.id === c.space_id)?.slug === "commons")?.id ?? options[0]?.id ?? "";
  const [channelId, setChannelId] = useState("");
  const target = options.find((c) => c.id === (channelId || defaultId));
  const spaceName = (c: Channel) => spaces.find((s) => s.id === c.space_id)?.name ?? "";

  async function submit() {
    if (!userId || !target || (!body.trim() && !media.items.length)) return;
    setBusy(true);
    setError(null);
    try {
      const attachments = await media.upload(userId);
      const { data, error } = await supabase
        .from("cm_posts")
        .insert({ channel_id: target.id, space_id: target.space_id, author_id: userId, body: mentions.encode(body.trim()), attachments })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      onPosted(data as Post);
      setBody("");
      media.clear();
      mentions.reset();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!options.length) return null;

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar name={profile?.display_name} url={profile?.avatar_url} size={40} />
        <div className="min-w-0 flex-1 space-y-2.5">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="block w-full truncate rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3.5 py-2.5 text-left text-[15px] text-[var(--cm-faint)] transition hover:border-[#D4AF63]"
            >
              Share with the Collective…
            </button>
          ) : (
            <>
              <MentionTextArea
                autoFocus
                value={body}
                onValueChange={setBody}
                mentions={mentions}
                onPaste={pasteInto(media)}
                placeholder={target?.prompt || "Share a win, ask a question, or start a conversation. (Type @ to tag someone.)"}
                className="min-h-[110px]"
                rows={4}
              />
              <DraftStrip draft={media} />
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--cm-muted)]">
                <label htmlFor="home-pathway">Post to</label>
                <select
                  id="home-pathway"
                  value={target?.id ?? ""}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="max-w-full rounded-lg border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-2 py-1.5 text-[13.5px] text-[var(--cm-ink)]"
                >
                  {options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {spaces.find((s) => s.id === c.space_id)?.slug === "commons" ? c.name : `${spaceName(c)} · ${c.name}`}
                    </option>
                  ))}
                </select>
              </div>
              <ErrorNote>{error}</ErrorNote>
              <div className="flex items-center justify-between gap-2">
                <AttachButton draft={media} />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      setBody("");
                      media.clear();
                      mentions.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="gold" size="sm" disabled={busy || (!body.trim() && !media.items.length)} onClick={submit}>
                    {busy ? media.progress ?? "Posting…" : "Post"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
