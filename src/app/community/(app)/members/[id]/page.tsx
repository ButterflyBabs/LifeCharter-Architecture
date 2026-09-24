"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Ban, Flag, Globe, MapPin, MessageCircle, ShieldAlert } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import { toPlain } from "@/lib/community/mentions";
import type { Membership, Post, Profile, SpaceRole } from "@/lib/community/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, PageLoading, RichText, PlusMark } from "@/components/community/ui";
import { ReportDialog } from "@/components/community/ReportDialog";

export default function MemberPage({ params }: { params: { id: string } }) {
  const { supabase, userId, spaces, isAdmin, blockedIds, block, unblock, plusIds } = useCommunity();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reporting, setReporting] = useState(false);
  const blocked = blockedIds.has(params.id);
  const router = useRouter();
  const [p, setP] = useState<Profile | null | undefined>(undefined);
  const [their, setTheir] = useState<Membership[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [prof, mem, ps] = await Promise.all([
      supabase.from("cm_profiles").select("*").eq("user_id", params.id).maybeSingle(),
      supabase.from("cm_space_members").select("*").eq("user_id", params.id),
      supabase.from("cm_posts").select("*").eq("author_id", params.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(5),
    ]);
    setP((prof.data as Profile) ?? null);
    setTheir((mem.data as Membership[]) ?? []);
    setPosts((ps.data as Post[]) ?? []);
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function message() {
    setError(null);
    const { data, error } = await supabase.rpc("cm_start_dm", { p_other: params.id });
    if (error) return setError(error.message);
    router.push(`/community/messages/${data}`);
  }

  if (p === undefined) return <PageLoading />;
  if (p === null) return <EmptyState icon="🕊️" title="This member isn't available" />;

  const shared = spaces.filter((s) => their.some((m) => m.space_id === s.id));
  const website = p.website && (/^https?:\/\//.test(p.website) ? p.website : `https://${p.website}`);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-[#123F47] via-[#1A2E44] to-[#1F2B59]" />
        <div className="px-5 pb-5">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3">
            <Avatar name={p.display_name} url={p.avatar_url} size={96} className="ring-4" />
            {p.user_id !== userId ? (
              <span className="flex flex-wrap items-center gap-2">
                {!blocked && (
                  <Button variant="gold" onClick={message}>
                    <MessageCircle className="h-4 w-4" /> Message
                  </Button>
                )}
                {blocked ? (
                  <Button variant="outline" onClick={() => void unblock(p.user_id)}>
                    Unblock
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setConfirmBlock(true)} aria-label={`Block ${p.display_name}`}>
                    <Ban className="h-4 w-4" /> Block
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setReporting(true)} aria-label={`Report ${p.display_name}`}>
                  <Flag className="h-4 w-4" /> Report
                </Button>
                {reporting && <ReportDialog target={{ type: "profile", id: p.user_id, userId: p.user_id, userName: p.display_name }} onClose={() => setReporting(false)} />}
              </span>
            ) : (
              <Link href="/community/profile">
                <Button variant="outline">Edit profile</Button>
              </Link>
            )}
          </div>
          <h1 className="mt-3 font-editorial text-[30px] font-semibold text-[var(--cm-ink)]">
            {p.display_name} {plusIds.has(p.user_id) && <PlusMark className="ml-1 text-[11px]" />}
          </h1>
          {p.headline && <p className="text-[15px] text-[var(--cm-muted-2)]">{p.headline}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-[var(--cm-muted)]">
            {p.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {p.location}
              </span>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 hover:text-[var(--cm-ink)]">
                <Globe className="h-4 w-4" /> {p.website}
              </a>
            )}
            <span>Member since {new Date(p.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          </div>
          {p.status === "suspended" && (
            <p className="mt-2">
              <Badge tone="gray">Paused</Badge>
            </p>
          )}
          <ErrorNote>{error}</ErrorNote>
          {blocked && (
            <p className="mt-3 rounded-xl bg-[var(--cm-fill-2)] px-3 py-2 text-[13.5px] text-[var(--cm-muted-2)]">
              You&rsquo;ve blocked {p.display_name}. You won&rsquo;t see their posts or replies, they can&rsquo;t message you, and their tags and replies won&rsquo;t notify you. They aren&rsquo;t told.
            </p>
          )}
          {confirmBlock && (
            <div role="alertdialog" aria-label={`Block ${p.display_name}?`} className="mt-3 rounded-xl border border-[#E9D7A9] bg-[var(--cm-gold-soft)] p-3 text-[14px] text-[var(--cm-ink)]">
              <p className="font-semibold">Block {p.display_name}?</p>
              <p className="mt-1 text-[13.5px] text-[var(--cm-muted-2)]">
                You won&rsquo;t see their posts or replies, you can&rsquo;t message each other, and their tags and replies won&rsquo;t notify you. They won&rsquo;t be told. You can unblock them anytime.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    setConfirmBlock(false);
                    try {
                      await block(p.user_id);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Couldn't block right now.");
                    }
                  }}
                >
                  Block
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmBlock(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {p.bio && <RichText text={p.bio} className="mt-4" />}
        </div>
      </Card>

      {shared.length > 0 && (
        <div>
          <h2 className="mb-2 font-editorial text-[21px] font-semibold text-[var(--cm-ink)]">Channels</h2>
          <div className="flex flex-wrap gap-2">
            {shared.map((s) => (
              <Link key={s.id} href={`/community/s/${s.slug}`} className="rounded-full border border-[var(--cm-line)] bg-[var(--cm-surface)] px-3 py-1 text-[13.5px] text-[var(--cm-ink)] hover:border-[#D4AF63]">
                {s.emoji} {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h2 className="mb-2 font-editorial text-[21px] font-semibold text-[var(--cm-ink)]">Recent posts</h2>
          <div className="space-y-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/community/post/${post.id}`}>
                <Card className="p-4 hover:border-[#D4AF63]">
                  <p className="text-[12.5px] text-[var(--cm-muted)]">{timeAgo(post.created_at)}</p>
                  <p className="line-clamp-2 text-[14.5px] text-[var(--cm-body)]">{toPlain(post.title || post.body)}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isAdmin && p.user_id !== userId && <AdminMemberTools profile={p} memberships={their} onChanged={load} />}
    </div>
  );
}

function AdminMemberTools({ profile, memberships, onChanged }: { profile: Profile; memberships: Membership[]; onChanged: () => void }) {
  const { supabase, spaces } = useCommunity();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => PromiseLike<unknown>) {
    setBusy(true);
    await fn();
    setBusy(false);
    onChanged();
  }

  return (
    <Card className="border-[#E9D7A9] p-5">
      <h2 className="flex items-center gap-2 font-editorial text-[21px] font-semibold text-[var(--cm-ink)]">
        <ShieldAlert className="h-5 w-5 text-[var(--cm-gold-text)]" /> Admin
      </h2>
      <p className="mb-3 text-[13px] text-[var(--cm-muted)]">Only super admins see this.</p>
      <div className="divide-y divide-[var(--cm-line-soft)] rounded-xl border border-[var(--cm-line-soft)]">
        {spaces.map((s) => {
          const m = memberships.find((x) => x.space_id === s.id);
          return (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="text-[14px] text-[var(--cm-ink)]">
                {s.emoji} {s.name}
              </span>
              {m ? (
                <span className="flex items-center gap-2">
                  <select
                    value={m.role}
                    disabled={busy}
                    aria-label={`Role in ${s.name}`}
                    onChange={(e) =>
                      run(() => supabase.from("cm_space_members").update({ role: e.target.value as SpaceRole }).eq("space_id", s.id).eq("user_id", profile.user_id))
                    }
                    className="rounded-lg border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-2 py-1 text-[13px]"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Channel admin</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => run(() => supabase.from("cm_space_members").delete().eq("space_id", s.id).eq("user_id", profile.user_id))}
                  >
                    Remove
                  </Button>
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => supabase.from("cm_space_members").insert({ space_id: s.id, user_id: profile.user_id, joined_via: "admin" }))}
                >
                  Add
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          variant={profile.status === "active" ? "danger" : "outline"}
          disabled={busy}
          onClick={() => {
            const next = profile.status === "active" ? "suspended" : "active";
            if (next === "suspended" && !confirm(`Pause ${profile.display_name}'s access to the Collective?`)) return;
            void run(() => supabase.from("cm_profiles").update({ status: next }).eq("user_id", profile.user_id));
          }}
        >
          {profile.status === "active" ? "Pause membership" : "Restore membership"}
        </Button>
      </div>
    </Card>
  );
}
