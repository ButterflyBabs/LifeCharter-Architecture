"use client";

// Monthly alignment report (Collective Plus): balance across the areas of
// life, the alignment trend, the month's wins — and Mariposa's take.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { isoDate, parseDate, weekLabel, type JournalEntry } from "@/lib/community/journal";
import { Card, EmptyState, Heading, PageLoading } from "@/components/community/ui";
import { useJournalDimensions } from "@/components/community/JournalSheet";
import { AssistButton, PlusInvite, Suggestion, askJournalAi, useJournalAi, usePlusAccess } from "@/components/community/JournalAssist";

export default function ReportPage() {
  const { supabase, userId, isPlus } = useCommunity();
  const access = usePlusAccess(isPlus);
  const dimensions = useJournalDimensions();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("cm_journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: true })
      .limit(1000)
      .then(({ data }: { data: JournalEntry[] | null }) => setEntries(data ?? []));
  }, [supabase, userId]);

  const monthStart = isoDate(month);
  const monthEnd = isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const inMonth = useMemo(() => (entries ?? []).filter((e) => e.week_start >= monthStart && e.week_start <= monthEnd), [entries, monthStart, monthEnd]);

  if (access.loading || entries === null) return <PageLoading />;

  const back = (
    <Link href="/community/journal" className="mb-3 inline-flex items-center gap-1 text-[13.5px] text-[var(--cm-muted-2)] hover:text-[var(--cm-ink)]">
      <ArrowLeft className="h-4 w-4" /> My journal
    </Link>
  );
  if (!access.has) {
    return (
      <div>
        {back}
        <Heading>Monthly alignment report</Heading>
        <PlusInvite title="Your monthly alignment report" what="See your balance across the areas of life, your alignment trend and your wins, month by month." />
      </div>
    );
  }

  const wins = inMonth.filter((e) => e.kind === "win");
  const intentionWeeks = new Set(inMonth.filter((e) => e.kind === "intention").map((e) => e.week_start)).size;
  const ratings = inMonth.filter((e) => e.kind === "reflection" && e.rating);
  const avg = ratings.length ? (ratings.reduce((s, e) => s + (e.rating ?? 0), 0) / ratings.length).toFixed(1) : "—";
  const dimCounts = dimensions.map((d) => ({ d, n: inMonth.filter((e) => e.dimension === d).length }));
  // Alignment trend: the last 12 reflections up to the end of this month.
  const trend = (entries ?? []).filter((e) => e.kind === "reflection" && e.rating && e.week_start <= monthEnd).slice(-12);
  const monthName = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const isCurrent = monthStart === isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  return (
    <div className="space-y-5">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading sub="Private to you.">Monthly alignment report</Heading>
        <div className="flex items-center gap-1">
          <button aria-label="Previous month" className="rounded-full p-2 hover:bg-[var(--cm-fill)]" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[150px] text-center font-semibold text-[var(--cm-ink)]">{monthName}</span>
          <button aria-label="Next month" disabled={isCurrent} className="rounded-full p-2 hover:bg-[var(--cm-fill)] disabled:opacity-30" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {inMonth.length === 0 ? (
        <EmptyState icon="📓" title={`Nothing journaled in ${monthName}`}>
          Set an intention or capture a win and your report will start to fill in.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat value={intentionWeeks} label={intentionWeeks === 1 ? "week with an intention" : "weeks with an intention"} />
            <Stat value={wins.length} label={wins.length === 1 ? "win" : "wins"} />
            <Stat value={avg} label="average alignment" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">Balance across your life</p>
              {dimCounts.some((x) => x.n) ? (
                <BalanceWheel data={dimCounts} />
              ) : (
                <p className="mt-3 text-[13.5px] text-[var(--cm-muted-2)]">Tag entries with an area of life and your balance wheel will appear here.</p>
              )}
            </Card>
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">Alignment trend</p>
              {trend.length >= 2 ? (
                <TrendLine points={trend.map((e) => ({ label: e.week_start, value: e.rating ?? 0 }))} />
              ) : (
                <p className="mt-3 text-[13.5px] text-[var(--cm-muted-2)]">Rate a couple of weekly reflections to see your trend.</p>
              )}
            </Card>
          </div>

          {wins.length > 0 && (
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">Your wins in {month.toLocaleDateString(undefined, { month: "long" })}</p>
              <ul className="mt-2 space-y-1.5">
                {wins.map((w) => (
                  <li key={w.id} className="flex items-start gap-2 text-[14.5px] text-[var(--cm-ink)]">
                    <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cm-gold-text)]" />
                    <span>
                      {w.headline}
                      <span className="ml-2 text-[12px] text-[var(--cm-muted)]">
                        {weekLabel(w.week_start)}
                        {w.dimension ? ` · ${w.dimension}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <MariposaTake since={monthStart} enough={inMonth.length >= 3} monthName={monthName} />
        </>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="p-4 text-center">
      <p className="font-display text-[28px] font-semibold leading-none text-[var(--cm-ink)]">{value}</p>
      <p className="mt-1 text-[12px] text-[var(--cm-muted-2)]">{label}</p>
    </Card>
  );
}

function MariposaTake({ since, enough, monthName }: { since: string; enough: boolean; monthName: string }) {
  const ai = useJournalAi();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ patterns: string[]; suggestion: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!ai || !enough) return null;
  if (result) {
    return (
      <Suggestion name={ai.assistantName} onDismiss={() => setResult(null)}>
        <ul className="list-disc space-y-1.5 pl-5">
          {result.patterns.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        {result.suggestion && <p className="mt-2 font-semibold">{result.suggestion}</p>}
      </Suggestion>
    );
  }
  return (
    <Card className="flex flex-col items-start justify-between gap-2 p-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-semibold text-[var(--cm-ink)]">{ai.assistantName}&rsquo;s take on {monthName}</p>
        {error && <p className="text-[12.5px] text-[var(--cm-muted)]">{error}</p>}
      </div>
      <AssistButton
        busy={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            setResult(await askJournalAi("lookback", { since }));
          } catch (e) {
            setError(e instanceof Error ? e.message : "Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        What patterns do you see?
      </AssistButton>
    </Card>
  );
}

// A radar chart of how many entries touched each area of life.
function BalanceWheel({ data }: { data: { d: string; n: number }[] }) {
  const size = 300;
  const c = size / 2;
  const r = 100;
  const max = Math.max(1, ...data.map((x) => x.n));
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v] as const;
  };
  const poly = data.map((x, i) => pt(i, x.n / max).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto mt-2 w-full max-w-[320px]" role="img" aria-label="Balance across areas of life">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={data.map((_, i) => pt(i, k).join(",")).join(" ")} fill="none" stroke="var(--cm-line)" strokeWidth={1} />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--cm-line)" strokeWidth={1} />;
      })}
      <polygon points={poly} fill="rgba(212,175,99,0.35)" stroke="#B8923F" strokeWidth={2} />
      {data.map((x, i) => {
        const [lx, ly] = pt(i, 1.22);
        return (
          <text key={x.d} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fill={x.n ? "var(--cm-ink)" : "var(--cm-faint)"}>
            {x.d.length > 14 ? `${x.d.slice(0, 13)}…` : x.d}
          </text>
        );
      })}
    </svg>
  );
}

function TrendLine({ points }: { points: { label: string; value: number }[] }) {
  const w = 320;
  const h = 170;
  const pad = 24;
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => h - pad - ((v - 1) / 4) * (h - pad * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" role="img" aria-label="Weekly alignment ratings">
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} stroke="var(--cm-line)" strokeWidth={1} />
          <text x={pad - 8} y={y(v)} fontSize={10} textAnchor="end" dominantBaseline="middle" fill="var(--cm-muted)">
            {v}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#B8923F" strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={p.label} cx={x(i)} cy={y(p.value)} r={4} fill="#D4AF63" stroke="#fff" strokeWidth={1.5}>
          <title>{`${weekLabel(p.label)}: ${p.value}/5`}</title>
        </circle>
      ))}
      <text x={pad} y={h - 4} fontSize={10} fill="var(--cm-muted)">
        {parseDate(points[0].label).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </text>
      <text x={w - pad} y={h - 4} fontSize={10} textAnchor="end" fill="var(--cm-muted)">
        {parseDate(points[points.length - 1].label).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </text>
    </svg>
  );
}
