"use client";

// Home — built around "What should I do next?" rather than "which channel?":
// Alignment Anchor → this week's intention → next session → continue your
// program → what's new, with a small "Explore LifeCharter" row at the end.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, Compass, Sparkles, Target, Anchor, Trophy } from "lucide-react";
import { useCommunity, useProfiles } from "@/lib/community/context";
import { eventWhen, timeAgo } from "@/lib/community/format";
import type { DiscoverCard, Post } from "@/lib/community/types";
import { upcomingEvents, type Session } from "@/lib/community/events";
import { Avatar, Button, Card, Eyebrow } from "@/components/community/ui";
import { useFileUrl } from "@/lib/community/storage";
import { InstallBanner } from "@/components/community/InstallApp";
import { WelcomeStrip } from "@/components/community/WelcomeStrip";
import { useViewAs } from "@/lib/community/prefs";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function CommunityHomePage() {
  return (
    <Suspense>
      <CommunityHome />
    </Suspense>
  );
}

function CommunityHome() {
  const { supabase, userId, profile, spaces, channels, memberships, isMember, isAdmin, refresh } = useCommunity();
  const params = useSearchParams();
  const [anchor, setAnchor] = useState<Post | null>(null);
  const [intention, setIntention] = useState<Post | null | undefined>(undefined);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [activity, setActivity] = useState<Post[]>([]);
  const [programLatest, setProgramLatest] = useState<Record<string, Post | null>>({});
  const [cards, setCards] = useState<DiscoverCard[]>([]);

  const channelBy = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);
  const spaceBy = useMemo(() => new Map(spaces.map((s) => [s.id, s])), [spaces]);
  const commons = spaces.find((s) => s.slug === "commons");
  const anchorChannel = commons && channels.find((c) => c.space_id === commons.id && c.slug === "alignment-anchor");
  const intentionChannel = commons && channels.find((c) => c.space_id === commons.id && c.slug === "this-weeks-intention");
  const [viewAs] = useViewAs();
  // A super admin in "member view" sees Home as a free member would.
  const hiddenAdminOnly = isAdmin && viewAs === "member" ? new Set(memberships.filter((m) => m.joined_via === "admin" && !spaces.some((x) => x.id === m.space_id && (x.is_default || x.visibility === "public"))).map((m) => m.space_id)) : new Set<string>();
  const myPrograms = spaces.filter((s) => (s.section === "programs" || s.section === "alumni") && isMember(s.id) && !hiddenAdminOnly.has(s.id));
  const memberSpaceIds = memberships.map((m) => m.space_id).filter((id) => !hiddenAdminOnly.has(id));

  useEffect(() => {
    if (!userId) return;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const annIds = channels.filter((c) => c.kind === "announcements" && memberSpaceIds.includes(c.space_id)).map((c) => c.id);
    const discIds = channels.filter((c) => c.kind === "discussion").map((c) => c.id);
    void (async () => {
      const [a, i, e, ann, act, disc] = await Promise.all([
        anchorChannel
          ? supabase.from("cm_posts").select("*").eq("channel_id", anchorChannel.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
        intentionChannel
          ? supabase.from("cm_posts").select("*").eq("channel_id", intentionChannel.id).eq("author_id", userId).gte("created_at", weekStart.toISOString()).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
        upcomingEvents(supabase, { limit: 1, days: 120 }),
        annIds.length
          ? supabase.from("cm_posts").select("*").in("channel_id", annIds).is("deleted_at", null).order("created_at", { ascending: false }).limit(3)
          : Promise.resolve({ data: [] }),
        discIds.length
          ? supabase.from("cm_posts").select("*").in("channel_id", discIds).is("deleted_at", null).order("last_activity_at", { ascending: false }).limit(6)
          : Promise.resolve({ data: [] }),
        supabase.from("cm_discover_cards").select("*").eq("active", true).order("sort_order"),
      ]);
      setAnchor((a.data as Post) ?? null);
      setIntention((i.data as Post) ?? null);
      setNextSession(e[0] ?? null);
      setAnnouncements(((ann.data as Post[]) ?? []).filter((p) => p.channel_id !== anchorChannel?.id));
      setActivity((act.data as Post[]) ?? []);
      setCards(((disc.data as DiscoverCard[]) ?? []).filter((c) => !c.space_id || !memberSpaceIds.includes(c.space_id)));

      const latest: Record<string, Post | null> = {};
      await Promise.all(
        myPrograms.map(async (s) => {
          const { data } = await supabase.from("cm_posts").select("*").eq("space_id", s.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
          latest[s.id] = (data as Post) ?? null;
        })
      );
      setProgramLatest(latest);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId, channels.length, memberships.length, viewAs]);

  const firstName = profile?.display_name?.split(" ")[0] ?? "friend";
  const showWelcome = params.get("welcome") === "1" || (profile && !profile.onboarded);

  return (
    <div className="space-y-7">
      <div>
        <Eyebrow>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</Eyebrow>
        <h1 className="mt-1 font-display text-[34px] font-semibold leading-tight text-[#1F315B] md:text-[40px]">
          {greeting()}, {firstName}
        </h1>
        <p className="font-editorial text-[18px] italic text-[#A8873F]">Create Balance. Build Alignment. Take Command.</p>
      </div>

      <InstallBanner />

      {showWelcome && profile && (
        <WelcomeCard
          onDone={async () => {
            await supabase.from("cm_profiles").update({ onboarded: true }).eq("user_id", profile.user_id);
            await refresh();
            window.history.replaceState(null, "", "/community");
          }}
        />
      )}

      <WelcomeStrip />

      {/* What's next */}
      <section className="grid gap-4 md:grid-cols-2">
        <NextCard
          icon={<Anchor className="h-5 w-5" />}
          label="Your Alignment Anchor"
          href={anchor ? `/community/post/${anchor.id}` : anchorChannel && commons ? `/community/s/${commons.slug}/${anchorChannel.slug}` : "/community"}
          title={anchor?.title || (anchor ? anchor.body.split("\n")[0].slice(0, 90) : "This week's Anchor is on its way")}
          detail={anchor ? `Posted ${timeAgo(anchor.created_at)}` : "The week's topic, replay and reflection will appear here."}
          featured
        />
        <NextCard
          icon={<Target className="h-5 w-5" />}
          label="This Week's Intention"
          href={intentionChannel && commons ? `/community/s/${commons.slug}/${intentionChannel.slug}` : "/community"}
          title={intention ? intention.body.split("\n")[0].slice(0, 90) : "What are you aligning with this week?"}
          detail={intention ? "Your intention is set — keep it in view." : "Set your intention and let the Collective hold you to it."}
          done={!!intention}
          cta={intention === null ? "Set my intention" : undefined}
        />
        <NextCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Your Next Session"
          href={nextSession ? `/community/events#${nextSession.event.id}` : "/community/events"}
          title={nextSession?.event.title ?? "No sessions scheduled yet"}
          detail={nextSession ? eventWhen(nextSession.start.toISOString(), nextSession.end.toISOString()) : "Alignment Anchors, office hours and workshops appear here."}
        />
        {myPrograms[0] ? (
          <NextCard
            icon={<Compass className="h-5 w-5" />}
            label="Pick Up Where You Left Off"
            href={`/community/s/${myPrograms[0].slug}`}
            title={myPrograms[0].name}
            detail={
              programLatest[myPrograms[0].id]
                ? `Latest: ${(programLatest[myPrograms[0].id]!.title || programLatest[myPrograms[0].id]!.body).slice(0, 70)}`
                : "Jump back into the conversation."
            }
          />
        ) : profile && !profile.onboarded ? (
          <NextCard
            icon={<Compass className="h-5 w-5" />}
            label="Start Here"
            href="/community/s/start-here/introductions"
            title="Introduce yourself to the Collective"
            detail="Where are you now, and what are you creating?"
          />
        ) : (
          <NextCard
            icon={<Trophy className="h-5 w-5" />}
            label="Share a Win"
            href="/community/s/commons/wins"
            title="What did you move forward this week?"
            detail="Big or small, it counts — and it lifts everyone who reads it."
          />
        )}
      </section>

      {myPrograms.length > 1 && (
        <section>
          <SectionTitle>Your channels</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {myPrograms.slice(1).map((s) => (
              <Link key={s.id} href={`/community/s/${s.slug}`}>
                <Card className="flex items-center gap-3 p-4 hover:border-[#D4AF63]">
                  <span className="text-[24px]">{s.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[#1F315B]">{s.name}</span>
                    <span className="block truncate text-[12.5px] text-[#8A8FA0]">
                      {programLatest[s.id] ? `Active ${timeAgo(programLatest[s.id]!.created_at)}` : s.tagline}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#C9BFA8]" />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {announcements.length > 0 && (
        <section>
          <SectionTitle>Announcements</SectionTitle>
          <div className="space-y-3">
            {announcements.map((p) => (
              <FeedLine key={p.id} post={p} where={channelBy.get(p.channel_id)?.name} space={spaceBy.get(p.space_id)?.name} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Community activity</SectionTitle>
        {activity.length ? (
          <div className="space-y-3">
            {activity.map((p) => (
              <FeedLine key={p.id} post={p} where={channelBy.get(p.channel_id)?.name} emoji={channelBy.get(p.channel_id)?.emoji} />
            ))}
          </div>
        ) : (
          <Card className="p-5 text-[14.5px] text-[#6B6F80]">
            It&rsquo;s quiet in here — say hello in{" "}
            <Link href="/community/s/start-here/introductions" className="font-semibold text-[#A8873F] underline-offset-2 hover:underline">
              Introduce Yourself
            </Link>
            .
          </Card>
        )}
      </section>

      {cards.length > 0 && (
        <section>
          <SectionTitle>Explore LifeCharter</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map((c) => (
              <DiscoverTile key={c.id} card={c} />
            ))}
          </div>
        </section>
      )}

      {isAdmin && (
        <p className="text-center text-[12.5px] text-[#8A8FA0]">
          You&rsquo;re a super admin — manage spaces, invite codes and cards in{" "}
          <Link href="/community/admin" className="underline">
            Admin
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-display text-[24px] font-semibold text-[#1F315B]">{children}</h2>;
}

function NextCard({
  icon,
  label,
  title,
  detail,
  href,
  featured,
  done,
  cta,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  detail: string;
  href: string;
  featured?: boolean;
  done?: boolean;
  cta?: string;
}) {
  return (
    <Link href={href} className="group">
      <Card
        className={
          featured
            ? "h-full border-transparent bg-gradient-to-br from-[#1F315B] to-[#0F1A38] p-5 text-[#F8F5F0] transition group-hover:-translate-y-0.5"
            : "h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-[#D4AF63]"
        }
      >
        <div className={featured ? "flex items-center gap-2 text-[#E6C988]" : "flex items-center gap-2 text-[#A8873F]"}>
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">{label}</span>
          {done && <Check className="ml-auto h-4 w-4 text-emerald-600" aria-label="Done" />}
        </div>
        <p className={featured ? "mt-3 font-display text-[23px] font-semibold leading-snug text-white" : "mt-3 font-display text-[21px] font-semibold leading-snug text-[#1F315B]"}>
          {title}
        </p>
        <p className={featured ? "mt-1 text-[13.5px] text-[#EDE6D6]/75" : "mt-1 text-[13.5px] text-[#6B6F80]"}>{detail}</p>
        {cta && (
          <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#A8873F]">
            {cta} <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </Card>
    </Link>
  );
}

function FeedLine({ post, where, space, emoji }: { post: Post; where?: string; space?: string; emoji?: string | null }) {
  const people = useProfiles([post.author_id]);
  const a = people[post.author_id];
  return (
    <Link href={`/community/post/${post.id}`}>
      <Card className="flex gap-3 p-4 transition hover:border-[#D4AF63]">
        <Avatar name={a?.display_name} url={a?.avatar_url} size={38} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[#8A8FA0]">
            <span className="font-semibold text-[#1F315B]">{a?.display_name ?? "…"}</span> in {emoji} {where}
            {space ? ` · ${space}` : ""} · {timeAgo(post.created_at)}
          </p>
          {post.title && <p className="font-semibold text-[#1F315B]">{post.title}</p>}
          <p className="line-clamp-2 text-[14.5px] text-[#2A3552]">
            {post.body || (post.attachments?.length ? `📷 Shared ${post.attachments.length === 1 ? "a photo" : `${post.attachments.length} photos`}` : "")}
          </p>
          {post.comment_count > 0 && <p className="mt-1 text-[12.5px] font-semibold text-[#A8873F]">{post.comment_count} replies</p>}
        </div>
      </Card>
    </Link>
  );
}

function DiscoverTile({ card }: { card: DiscoverCard }) {
  const img = useFileUrl(card.image_url);
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-20 items-center justify-center bg-gradient-to-br from-[#F5EBD3] to-[#EFE6D2] text-[#A8873F]">
          <Sparkles className="h-6 w-6" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="font-display text-[19px] font-semibold leading-snug text-[#1F315B]">{card.title}</p>
        {card.blurb && <p className="mt-1 text-[13.5px] text-[#6B6F80]">{card.blurb}</p>}
        {card.teaser && <p className="mt-2 font-editorial text-[14.5px] italic text-[#5B6275]">{card.teaser}</p>}
        {card.cta_url && (
          <a href={card.cta_url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 text-[13.5px] font-semibold text-[#A8873F] hover:underline">
            {card.cta_label} →
          </a>
        )}
      </div>
    </Card>
  );
}

function WelcomeCard({ onDone }: { onDone: () => void }) {
  const steps = [
    { href: "/community/profile", label: "Add a photo and a line about you" },
    { href: "/legal/community-guidelines", label: "Read the Community Guidelines — how we show up for each other" },
    { href: "/community/s/start-here/introductions", label: "Introduce yourself" },
    { href: "/community/profile#app", label: "Add the app to your phone & turn on notifications" },
  ];
  return (
    <Card className="border-[#E6C988] bg-gradient-to-br from-[#FFFDF8] to-[#FBF3DF] p-5">
      <Eyebrow>Welcome to The LifeCharter Collective</Eyebrow>
      <p className="mt-1 font-display text-[24px] font-semibold text-[#1F315B]">Four small steps to settle in</p>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={s.href}>
            <Link href={s.href} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 text-[14.5px] text-[#1F315B] hover:bg-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F315B] text-[12px] font-bold text-[#E6C988]">{i + 1}</span>
              {s.label}
              <ArrowRight className="ml-auto h-4 w-4 text-[#C9BFA8]" />
            </Link>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onDone}>
          I&rsquo;m settled — hide this
        </Button>
      </div>
    </Card>
  );
}
