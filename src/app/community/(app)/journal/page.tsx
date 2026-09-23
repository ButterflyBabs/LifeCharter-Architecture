"use client";

// My Alignment Journal — private, week by week: this week's intention, wins
// and reflection, simple tracking, search, and the encouragement shared
// entries received from the Collective.
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, MessageSquare, Pencil, Plus, Search, Share2, Target, Trophy, Sparkles } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { weekLabel, weekStartOf, type JournalEntry, type JournalKind } from "@/lib/community/journal";
import { Badge, Button, Card, EmptyState, Heading, Input, PageLoading, RichText } from "@/components/community/ui";
import { JournalSheet } from "@/components/community/JournalSheet";

type Sheet = { kind: JournalKind; entry?: JournalEntry | null } | null;

export default function JournalPage() {
  return (
    <Suspense>
      <Journal />
    </Suspense>
  );
}

function Journal() {
  const { supabase, userId } = useCommunity();
  const params = useSearchParams();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [shared, setShared] = useState<Record<string, { reactions: number; replies: number }>>({});
  const [sheet, setSheet] = useState<Sheet>(null);
  const [q, setQ] = useState("");
  const thisWeek = weekStartOf();

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("cm_journal_entries").select("*").eq("user_id", userId).order("week_start", { ascending: false }).order("created_at", { ascending: true }).limit(1000);
    const list = (data as JournalEntry[]) ?? [];
    setEntries(list);
    const postIds = list.map((e) => e.shared_post_id).filter(Boolean) as string[];
    if (postIds.length) {
      const [{ data: posts }, { data: reacts }] = await Promise.all([
        supabase.from("cm_posts").select("id, comment_count").in("id", postIds).is("deleted_at", null),
        supabase.from("cm_reactions").select("post_id").in("post_id", postIds),
      ]);
      const counts: Record<string, { reactions: number; replies: number }> = {};
      for (const p of (posts as { id: string; comment_count: number }[]) ?? []) counts[p.id] = { reactions: 0, replies: p.comment_count };
      for (const r of (reacts as { post_id: string }[]) ?? []) if (counts[r.post_id]) counts[r.post_id].reactions += 1;
      setShared(counts);
    }
  }, [supabase, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reminder links open the right entry straight away.
  useEffect(() => {
    const k = params.get("new") as JournalKind | null;
    if (k === "intention" || k === "win" || k === "reflection") {
      window.history.replaceState(null, "", "/community/journal");
      setSheet({ kind: k });
    }
  }, [params]);

  const weeks = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (entries ?? []).filter(
      (e) => !term || [e.headline, e.private_note, e.community_note, e.carry_forward, e.dimension].some((t) => t?.toLowerCase().includes(term))
    );
    const map = new Map<string, JournalEntry[]>();
    for (const e of list) {
      if (!map.has(e.week_start)) map.set(e.week_start, []);
      map.get(e.week_start)!.push(e);
    }
    return Array.from(map.entries());
  }, [entries, q]);

  const stats = useMemo(() => {
    const all = entries ?? [];
    const year = String(new Date().getFullYear());
    const reflections = all.filter((e) => e.kind === "reflection" && e.rating).slice(0, 8);
    const topDims = Object.entries(
      all.filter((e) => e.kind === "win" && e.dimension).reduce<Record<string, number>>((acc, e) => ((acc[e.dimension!] = (acc[e.dimension!] ?? 0) + 1), acc), {})
    ).sort((a, b) => b[1] - a[1]);
    return {
      intentionWeeks: new Set(all.filter((e) => e.kind === "intention").map((e) => e.week_start)).size,
      winsThisYear: all.filter((e) => e.kind === "win" && e.week_start.startsWith(year)).length,
      avg: reflections.length ? (reflections.reduce((s, e) => s + (e.rating ?? 0), 0) / reflections.length).toFixed(1) : null,
      topDim: topDims[0]?.[0] ?? null,
    };
  }, [entries]);

  if (entries === null) return <PageLoading />;
  const current = entries.filter((e) => e.week_start === thisWeek);
  const intention = current.find((e) => e.kind === "intention");
  const wins = current.filter((e) => e.kind === "win");
  const reflection = current.find((e) => e.kind === "reflection");
  const past = weeks.filter(([w]) => w !== thisWeek || q.trim());

  return (
    <div className="space-y-6">
      <Heading sub={<span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Private to you. Anything you share goes to the Collective as a headline and note — never your journal.</span>}>
        My Alignment Journal
      </Heading>

      {/* This week */}
      <Card className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">This week · {weekLabel(thisWeek)}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <WeekSlot
            icon={<Target className="h-4 w-4" />}
            label="Intention"
            filled={intention?.headline ?? null}
            cta="Set my intention"
            onClick={() => setSheet({ kind: "intention", entry: intention })}
          />
          <WeekSlot
            icon={<Trophy className="h-4 w-4" />}
            label={`Wins${wins.length ? ` · ${wins.length}` : ""}`}
            filled={wins.length ? wins[wins.length - 1].headline : null}
            cta="Capture a win"
            onClick={() => setSheet({ kind: "win" })}
            addMore={wins.length > 0}
          />
          <WeekSlot
            icon={<Sparkles className="h-4 w-4" />}
            label="Reflection"
            filled={reflection ? `${reflection.rating ? `${reflection.rating}/5 · ` : ""}${reflection.headline ?? "Reflected"}` : null}
            cta="Reflect on my week"
            onClick={() => setSheet({ kind: "reflection", entry: reflection })}
          />
        </div>
      </Card>

      {/* Tracking */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={stats.intentionWeeks} label={stats.intentionWeeks === 1 ? "week with an intention" : "weeks with an intention"} />
          <Stat value={stats.winsThisYear} label={`wins in ${new Date().getFullYear()}`} />
          <Stat value={stats.avg ?? "—"} label="average alignment (last 8 weeks)" />
          <Stat value={stats.topDim ?? "—"} label="where most wins happen" small />
        </div>
      )}

      {/* Search + history */}
      {entries.length > 0 ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cm-faint)]" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your journal" className="pl-9" />
          </div>
          <div className="space-y-4">
            {past.map(([week, list]) => (
              <section key={week}>
                <h2 className="mb-2 font-display text-[20px] font-semibold text-[var(--cm-ink)]">
                  {week === thisWeek ? "This week" : weekLabel(week)}
                </h2>
                <Card className="divide-y divide-[var(--cm-line-soft)] overflow-hidden">
                  {list.map((e) => (
                    <EntryRow key={e.id} e={e} stats={e.shared_post_id ? shared[e.shared_post_id] : undefined} onEdit={() => setSheet({ kind: e.kind, entry: e })} />
                  ))}
                </Card>
              </section>
            ))}
            {q.trim() && past.length === 0 && <EmptyState icon="🔍" title="Nothing matches that search" />}
          </div>
        </>
      ) : (
        <EmptyState icon="📓" title="Your journal starts this week">
          Set an intention, capture a win, and look back on how far you&rsquo;ve come.
        </EmptyState>
      )}

      {sheet && (
        <JournalSheet
          kind={sheet.kind}
          entry={sheet.entry}
          onClose={() => setSheet(null)}
          onSaved={() => {
            setSheet(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function WeekSlot({ icon, label, filled, cta, onClick, addMore }: { icon: React.ReactNode; label: string; filled: string | null; cta: string; onClick: () => void; addMore?: boolean }) {
  return (
    <button onClick={onClick} className="group rounded-xl border border-[var(--cm-line)] bg-[var(--cm-fill)] p-3 text-left transition hover:border-[#D4AF63]">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cm-gold-text)]">
        {icon} {label}
      </span>
      {filled ? (
        <span className="mt-1.5 line-clamp-2 block text-[14.5px] font-semibold text-[var(--cm-ink)]">{filled}</span>
      ) : (
        <span className="mt-1.5 inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--cm-gold-text)]">
          <Plus className="h-4 w-4" /> {cta}
        </span>
      )}
      {addMore && (
        <span className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--cm-gold-text)]">
          <Plus className="h-3.5 w-3.5" /> Add another
        </span>
      )}
    </button>
  );
}

function Stat({ value, label, small }: { value: string | number; label: string; small?: boolean }) {
  return (
    <Card className="p-3.5">
      <p className={small ? "truncate font-display text-[20px] font-semibold text-[var(--cm-ink)]" : "font-display text-[28px] font-semibold tabular-nums text-[var(--cm-ink)]"}>{value}</p>
      <p className="text-[12px] leading-snug text-[var(--cm-muted)]">{label}</p>
    </Card>
  );
}

const KIND: Record<JournalKind, { label: string; icon: React.ReactNode }> = {
  intention: { label: "Intention", icon: <Target className="h-3.5 w-3.5" /> },
  win: { label: "Win", icon: <Trophy className="h-3.5 w-3.5" /> },
  reflection: { label: "Reflection", icon: <Sparkles className="h-3.5 w-3.5" /> },
};

function EntryRow({ e, stats, onEdit }: { e: JournalEntry; stats?: { reactions: number; replies: number }; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="navy">
              {KIND[e.kind].icon} {KIND[e.kind].label}
            </Badge>
            {e.rating && <Badge>{e.rating}/5 aligned</Badge>}
            {e.dimension && <Badge tone="gray">{e.dimension}</Badge>}
            {e.shared_post_id && stats && (
              <Link href={`/community/post/${e.shared_post_id}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:underline">
                <Share2 className="h-3 w-3" /> Shared · {stats.reactions} {stats.reactions === 1 ? "reaction" : "reactions"} · {stats.replies}{" "}
                <MessageSquare className="h-3 w-3" />
              </Link>
            )}
          </div>
          {e.headline && <p className="mt-1.5 font-semibold text-[var(--cm-ink)]">{e.headline}</p>}
          {(e.private_note || e.carry_forward) && (
            <button onClick={() => setOpen((v) => !v)} className="mt-1 text-[12.5px] font-semibold text-[var(--cm-gold-text)] hover:underline">
              {open ? "Hide journal" : "Read journal"}
            </button>
          )}
          {open && (
            <div className="mt-2 space-y-2 rounded-xl bg-[var(--cm-fill-2)] p-3">
              {e.private_note && <RichText text={e.private_note} className="text-[14.5px]" />}
              {e.carry_forward && (
                <p className="text-[14px] text-[var(--cm-body)]">
                  <span className="font-semibold">Carrying forward:</span> {e.carry_forward}
                </p>
              )}
            </div>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit} aria-label="Edit entry">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
