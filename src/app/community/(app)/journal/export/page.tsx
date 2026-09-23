"use client";

// Journal export (Collective Plus): the whole journal as a clean printable
// page — "Save as PDF" from the browser's print dialog.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileDown } from "lucide-react";
import { useCommunity } from "@/lib/community/context";
import { isoDate, weekLabel, type JournalEntry, type JournalFocus } from "@/lib/community/journal";
import { Button, Card, Heading, Label, PageLoading } from "@/components/community/ui";
import { PlusInvite, usePlusAccess } from "@/components/community/JournalAssist";

const KIND_LABEL = { intention: "Intention", win: "Win", reflection: "Reflection" } as const;

export default function ExportPage() {
  const { supabase, userId, profile, isPlus } = useCommunity();
  const access = usePlusAccess(isPlus);
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [focuses, setFocuses] = useState<JournalFocus[]>([]);
  const [range, setRange] = useState<"all" | "year" | "90">("all");
  const [includePrivate, setIncludePrivate] = useState(true);

  useEffect(() => {
    if (!userId) return;
    void Promise.all([
      supabase.from("cm_journal_entries").select("*").eq("user_id", userId).order("week_start", { ascending: false }).order("created_at").limit(5000),
      supabase.from("cm_journal_focus").select("*").eq("user_id", userId).order("starts_on", { ascending: false }),
    ]).then(([e, f]) => {
      setEntries((e.data as JournalEntry[]) ?? []);
      setFocuses((f.data as JournalFocus[]) ?? []);
    });
  }, [supabase, userId]);

  const weeks = useMemo(() => {
    const from = range === "year" ? `${new Date().getFullYear()}-01-01` : range === "90" ? isoDate(new Date(Date.now() - 90 * 86400000)) : "";
    const map = new Map<string, JournalEntry[]>();
    for (const e of entries ?? []) {
      if (from && e.week_start < from) continue;
      if (!map.has(e.week_start)) map.set(e.week_start, []);
      map.get(e.week_start)!.push(e);
    }
    return Array.from(map.entries());
  }, [entries, range]);

  if (access.loading || entries === null) return <PageLoading />;
  const back = (
    <Link href="/community/journal" className="mb-3 inline-flex items-center gap-1 text-[13.5px] text-[var(--cm-muted-2)] hover:text-[var(--cm-ink)] print:hidden">
      <ArrowLeft className="h-4 w-4" /> My journal
    </Link>
  );
  if (!access.has) {
    return (
      <div>
        {back}
        <Heading>Export your journal</Heading>
        <PlusInvite title="Export your journal" what="Download your whole journal as a clean, printable PDF." />
      </div>
    );
  }

  return (
    <div>
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #journal-print, #journal-print * { visibility: visible !important; color: #1F315B !important; background: transparent !important; }
        #journal-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 12mm; }
        .jp-week { break-inside: avoid; }
        @page { margin: 16mm 0; }
      }`}</style>
      {back}
      <div className="print:hidden">
        <Heading sub="Choose what to include, then save it as a PDF from the print dialog.">Export your journal</Heading>
        <Card className="mb-6 flex flex-wrap items-end gap-4 p-4">
          <div>
            <Label htmlFor="range">Include</Label>
            <select
              id="range"
              value={range}
              onChange={(e) => setRange(e.target.value as typeof range)}
              className="rounded-xl border border-[var(--cm-line-strong)] bg-[var(--cm-surface)] px-3 py-2 text-[14.5px] text-[var(--cm-ink)]"
            >
              <option value="all">Everything</option>
              <option value="year">This year</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-[14px] text-[var(--cm-body)]">
            <input type="checkbox" checked={includePrivate} onChange={(e) => setIncludePrivate(e.target.checked)} /> Include private journal notes
          </label>
          <Button variant="gold" onClick={() => window.print()} className="ml-auto">
            <FileDown className="h-4 w-4" /> Save as PDF
          </Button>
        </Card>
      </div>

      <div id="journal-print" className="rounded-2xl bg-[var(--cm-surface)] p-6 text-[var(--cm-ink)] shadow-sm print:shadow-none">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">The LifeCharter Collective</p>
        <h1 className="font-display text-[30px] font-semibold">{profile?.display_name ? `${profile.display_name}’s` : "My"} Alignment Journal</h1>
        <p className="text-[13px] text-[var(--cm-muted-2)]">Exported {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>

        {focuses.length > 0 && (
          <section className="jp-week mt-6">
            <h2 className="font-display text-[20px] font-semibold">90-day focus</h2>
            {focuses.map((f) => (
              <p key={f.id} className="mt-1 text-[14px]">
                <strong>{f.title}</strong> · {f.starts_on} → {f.ends_on} · {f.status === "active" ? "in progress" : f.status === "done" ? "achieved" : "released"}
                {includePrivate && f.why ? <span className="block text-[13px] text-[var(--cm-muted-2)]">{f.why}</span> : null}
              </p>
            ))}
          </section>
        )}

        {weeks.length === 0 ? (
          <p className="mt-6 text-[14px] text-[var(--cm-muted-2)]">No entries in this range.</p>
        ) : (
          weeks.map(([week, list]) => (
            <section key={week} className="jp-week mt-6 border-t border-[var(--cm-line)] pt-4">
              <h2 className="font-display text-[19px] font-semibold">Week of {weekLabel(week)}</h2>
              {list.map((e) => (
                <div key={e.id} className="mt-2.5">
                  <p className="text-[14.5px]">
                    <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cm-gold-text)]">{KIND_LABEL[e.kind]}</span>
                    {e.rating ? <strong>{e.rating}/5 · </strong> : null}
                    {e.headline}
                    {e.dimension ? <span className="text-[12.5px] text-[var(--cm-muted)]"> · {e.dimension}</span> : null}
                  </p>
                  {includePrivate && e.private_note && <p className="mt-0.5 whitespace-pre-line text-[13.5px] text-[var(--cm-body)]">{e.private_note}</p>}
                  {e.carry_forward && <p className="mt-0.5 text-[13px] text-[var(--cm-muted-2)]">Carry forward: {e.carry_forward}</p>}
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
