"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Megaphone } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { eventWhen, timeAgo } from "@/lib/community/format";
import { upcomingEvents, type Session } from "@/lib/community/events";
import { Card, EmptyState, Eyebrow, Avatar } from "@/components/community/ui";
import { JoinSpaceBanner } from "@/components/community/JoinSpaceBanner";
import { useProfiles } from "@/lib/community/context";

export default function SpacePage({ params }: { params: { space: string } }) {
  const { supabase, spaceBySlug, channelsFor, isMember } = useCommunity();
  const space = spaceBySlug(params.space);
  const [activity, setActivity] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Session[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const people = useProfiles(memberIds);

  useEffect(() => {
    if (!space) return;
    void (async () => {
      const [posts, ev, mem] = await Promise.all([
        supabase.from("cm_posts").select("channel_id, created_at").eq("space_id", space.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(200),
        upcomingEvents(supabase, { spaceId: space.id, limit: 3, days: 120 }),
        supabase.from("cm_space_members").select("user_id", { count: "exact" }).eq("space_id", space.id).order("joined_at", { ascending: false }).limit(8),
      ]);
      const latest: Record<string, string> = {};
      for (const p of (posts.data as { channel_id: string; created_at: string }[]) ?? []) latest[p.channel_id] ??= p.created_at;
      setActivity(latest);
      setEvents(ev);
      setMemberIds(((mem.data as { user_id: string }[]) ?? []).map((m) => m.user_id));
      setMemberCount(mem.count ?? 0);
    })();
  }, [supabase, space]);

  if (!space) {
    return (
      <EmptyState icon="🧭" title="This channel isn't available">
        It may be private, or the link may have changed.
      </EmptyState>
    );
  }

  const channels = channelsFor(space.id);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>The LifeCharter Collective</Eyebrow>
        <h1 className="mt-1 font-editorial text-[32px] font-semibold leading-tight text-[var(--cm-ink)] md:text-[38px]">
          <span className="mr-2">{space.emoji}</span>
          {space.name}
        </h1>
        {space.tagline && <p className="mt-1 font-editorial text-[18px] italic text-[var(--cm-gold-text)]">{space.tagline}</p>}
        {space.description && <p className="mt-2 max-w-2xl text-[15px] text-[var(--cm-muted-2)]">{space.description}</p>}
      </div>

      {!isMember(space.id) && <JoinSpaceBanner spaceId={space.id} name={space.name} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {channels.map((c) => (
          <Link key={c.id} href={`/community/s/${space.slug}/${c.slug}`}>
            <Card className="flex h-full items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-[#D4AF63]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cm-fill-2)] text-[22px]">{c.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-semibold text-[var(--cm-ink)]">
                  {c.name}
                  {c.kind === "announcements" && <Megaphone className="h-3.5 w-3.5 text-[var(--cm-gold-text)]" aria-label="Announcements" />}
                </span>
                <span className="block text-[12.5px] text-[var(--cm-muted)]">{activity[c.id] ? `Active ${timeAgo(activity[c.id])}` : "No posts yet"}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--cm-faint)]" />
            </Card>
          </Link>
        ))}
      </div>

      {events.length > 0 && (
        <section>
          <h2 className="mb-2 font-editorial text-[22px] font-semibold text-[var(--cm-ink)]">Upcoming</h2>
          <div className="space-y-2">
            {events.map(({ event: e, start, end }) => (
              <Link key={e.id} href={`/community/events#${e.id}`}>
                <Card className="p-4 hover:border-[#D4AF63]">
                  <p className="font-semibold text-[var(--cm-ink)]">{e.title}</p>
                  <p className="text-[13px] text-[var(--cm-muted-2)]">{eventWhen(start.toISOString(), end.toISOString())}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-editorial text-[22px] font-semibold text-[var(--cm-ink)]">
          Members <span className="text-[16px] font-normal text-[var(--cm-muted)]">· {memberCount}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {memberIds.map((id) => (
            <Link key={id} href={`/community/members/${id}`} title={people[id]?.display_name}>
              <Avatar name={people[id]?.display_name} url={people[id]?.avatar_url} size={40} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
