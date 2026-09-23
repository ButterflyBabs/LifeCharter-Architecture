"use client";

// "Welcome our newest members" — a quiet strip on Home showing people who
// joined in the last two weeks, with a one-tap way to greet each of them:
// reply to their intro if they've posted one, otherwise say hello by DM.
// No alerts to everyone; the new member is notified of each reply as usual.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { toPlain } from "@/lib/community/mentions";
import type { Profile } from "@/lib/community/types";
import { Avatar, Card } from "./ui";

const WINDOW_DAYS = 14;

function joined(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "Joined today";
  if (days === 1) return "Joined yesterday";
  return `Joined ${days} days ago`;
}

interface Newcomer {
  profile: Pick<Profile, "user_id" | "display_name" | "avatar_url" | "headline" | "allow_dms" | "created_at">;
  introId: string | null;
  introLine: string | null;
  welcomed: boolean;
}

export function WelcomeStrip() {
  const { supabase, userId, spaces, channels, blockedIds } = useCommunity();
  const router = useRouter();
  const [people, setPeople] = useState<Newcomer[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const startHere = spaces.find((s) => s.slug === "start-here");
  const introChannel = startHere && channels.find((c) => c.space_id === startHere.id && c.slug === "introductions");

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
      const { data: profs } = await supabase
        .from("cm_profiles")
        .select("user_id, display_name, avatar_url, headline, allow_dms, created_at")
        .eq("status", "active")
        .eq("show_in_directory", true)
        .gte("created_at", since)
        .neq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(12);
      const list = ((profs as Newcomer["profile"][]) ?? []).filter((p) => !blockedIds.has(p.user_id));
      if (!list.length) return setPeople([]);

      let intros: { id: string; author_id: string; body: string; title: string | null }[] = [];
      if (introChannel) {
        const { data } = await supabase
          .from("cm_posts")
          .select("id, author_id, body, title, created_at")
          .eq("channel_id", introChannel.id)
          .in("author_id", list.map((p) => p.user_id))
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        intros = (data as typeof intros) ?? [];
      }
      const firstIntro = new Map<string, (typeof intros)[number]>();
      for (const i of intros) if (!firstIntro.has(i.author_id)) firstIntro.set(i.author_id, i);

      const introIds = Array.from(firstIntro.values()).map((i) => i.id);
      const { data: mine } = introIds.length
        ? await supabase.from("cm_comments").select("post_id").eq("author_id", userId).in("post_id", introIds).is("deleted_at", null)
        : { data: [] };
      const replied = new Set(((mine as { post_id: string }[]) ?? []).map((c) => c.post_id));

      setPeople(
        list.map((p) => {
          const intro = firstIntro.get(p.user_id);
          const line = intro ? toPlain(intro.title || intro.body).split("\n").find((l) => l.trim()) ?? null : null;
          return { profile: p, introId: intro?.id ?? null, introLine: line, welcomed: intro ? replied.has(intro.id) : false };
        })
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId, introChannel?.id, blockedIds]);

  async function sayHello(uid: string) {
    setBusy(uid);
    const { data, error } = await supabase.rpc("cm_start_dm", { p_other: uid });
    setBusy(null);
    if (!error && data) router.push(`/community/messages/${data}`);
  }

  if (!people?.length) return null;

  return (
    <section aria-labelledby="welcome-strip">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="welcome-strip" className="flex items-center gap-2 font-display text-[24px] font-semibold text-[var(--cm-ink)]">
          <Sparkles className="h-5 w-5 text-[var(--cm-gold-text)]" /> Welcome our newest members
        </h2>
        <span className="text-[12.5px] text-[var(--cm-muted)]">Joined in the last {WINDOW_DAYS} days</span>
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {people.map(({ profile: p, introId, introLine, welcomed }) => (
          <Card key={p.user_id} className="flex w-[240px] shrink-0 snap-start flex-col p-4">
            <Link href={`/community/members/${p.user_id}`} className="flex items-center gap-3">
              <Avatar name={p.display_name} url={p.avatar_url} size={44} />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-[var(--cm-ink)]">{p.display_name}</span>
                <span className="block text-[12px] text-[var(--cm-muted)]">{joined(p.created_at)}</span>
              </span>
            </Link>
            <p className="mt-3 line-clamp-3 flex-1 text-[13.5px] leading-snug text-[var(--cm-body)]">
              {introLine ? `“${introLine}”` : <span className="italic text-[var(--cm-muted)]">Hasn&rsquo;t introduced themselves yet.</span>}
            </p>
            <div className="mt-3">
              {introId ? (
                welcomed ? (
                  <Link
                    href={`/community/post/${introId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700"
                  >
                    <Check className="h-4 w-4" /> Welcomed
                  </Link>
                ) : (
                  <Link
                    href={`/community/post/${introId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#E6C988] via-[#D4AF63] to-[#B8923F] px-3 py-1.5 text-[13px] font-semibold text-[#0F1A38]"
                  >
                    👋 Say welcome
                  </Link>
                )
              ) : p.allow_dms ? (
                <button
                  onClick={() => sayHello(p.user_id)}
                  disabled={busy === p.user_id}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--cm-ink)] hover:border-[#D4AF63] disabled:opacity-60"
                >
                  <MessageCircle className="h-4 w-4" /> {busy === p.user_id ? "Opening…" : "Say hello"}
                </button>
              ) : (
                <Link href={`/community/members/${p.user_id}`} className="text-[13px] font-semibold text-[var(--cm-gold-text)] hover:underline">
                  View profile
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
