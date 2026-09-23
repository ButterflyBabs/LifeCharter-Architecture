"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe, MapPin, MessageCircle, ShieldAlert } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { timeAgo } from "@/lib/community/format";
import type { Membership, Post, Profile, SpaceRole } from "@/lib/community/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorNote, PageLoading, RichText } from "@/components/community/ui";

export default function MemberPage({ params }: { params: { id: string } }) {
  const { supabase, userId, spaces, isAdmin } = useCommunity();
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
        <div className="h-24 bg-gradient-to-br from-[#1F315B] via-[#2E4A7F] to-[#0F1A38]" />
        <div className="px-5 pb-5">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3">
            <Avatar name={p.display_name} url={p.avatar_url} size={96} className="ring-4" />
            {p.user_id !== userId ? (
              <Button variant="gold" onClick={message}>
                <MessageCircle className="h-4 w-4" /> Message
              </Button>
            ) : (
              <Link href="/community/profile">
                <Button variant="outline">Edit profile</Button>
              </Link>
            )}
          </div>
          <h1 className="mt-3 font-display text-[30px] font-semibold text-[#1F315B]">{p.display_name}</h1>
          {p.headline && <p className="text-[15px] text-[#5B6275]">{p.headline}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-[#8A8FA0]">
            {p.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {p.location}
              </span>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 hover:text-[#1F315B]">
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
          {p.bio && <RichText text={p.bio} className="mt-4" />}
        </div>
      </Card>

      {shared.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-[21px] font-semibold text-[#1F315B]">Spaces</h2>
          <div className="flex flex-wrap gap-2">
            {shared.map((s) => (
              <Link key={s.id} href={`/community/s/${s.slug}`} className="rounded-full border border-[#E9E2D3] bg-white px-3 py-1 text-[13.5px] text-[#1F315B] hover:border-[#D4AF63]">
                {s.emoji} {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-[21px] font-semibold text-[#1F315B]">Recent posts</h2>
          <div className="space-y-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/community/post/${post.id}`}>
                <Card className="p-4 hover:border-[#D4AF63]">
                  <p className="text-[12.5px] text-[#8A8FA0]">{timeAgo(post.created_at)}</p>
                  <p className="line-clamp-2 text-[14.5px] text-[#2A3552]">{post.title || post.body}</p>
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
    <Card className="border-[#E6C988] p-5">
      <h2 className="flex items-center gap-2 font-display text-[21px] font-semibold text-[#1F315B]">
        <ShieldAlert className="h-5 w-5 text-[#A8873F]" /> Admin
      </h2>
      <p className="mb-3 text-[13px] text-[#8A8FA0]">Only super admins see this.</p>
      <div className="divide-y divide-[#F0EBE0] rounded-xl border border-[#F0EBE0]">
        {spaces.map((s) => {
          const m = memberships.find((x) => x.space_id === s.id);
          return (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="text-[14px] text-[#1F315B]">
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
                    className="rounded-lg border border-[#DCD3C1] bg-white px-2 py-1 text-[13px]"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Space admin</option>
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
