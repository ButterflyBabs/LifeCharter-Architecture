"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Video } from "lucide-react";

type Call = { id: string; eventId: string; title: string; start: string; end: string; joinUrl: string | null; about: string };

// "This week's coaching calls": Mon-Sun of Command Suite coaching calls,
// so clients always know when and where to go for support and training.
export default function CoachingCallsCard({ compact = false }: { compact?: boolean }) {
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [week, setWeek] = useState<"this" | "next">("this");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/coaching-calls", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { calls: [] }))
      .then((d) => {
        setCalls(Array.isArray(d.calls) ? d.calls : []);
        setWeek(d.week === "next" ? "next" : "this");
      })
      .catch(() => setCalls([]));
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const day = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86_400_000);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  };
  const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const shown = (calls ?? []).slice(0, compact ? 8 : 30);
  const groups: { label: string; items: Call[] }[] = [];
  for (const c of shown) {
    const label = day(c.start);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(c);
    else groups.push({ label, items: [c] });
  }

  // Monday to Friday of the week being shown (no weekend calls).
  const weekDays = (() => {
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - ((base.getDay() + 6) % 7) + (week === "next" ? 7 : 0));
    return Array.from({ length: 5 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  })();

  const chip = (c: Call) => {
    const start = new Date(c.start).getTime();
    const end = new Date(c.end).getTime();
    const live = now >= start - 10 * 60_000 && now < end;
    return (
      <li key={c.id} title={c.about || c.title} className={`rounded-lg border bg-white dark:bg-[#1a2b4a]/60 p-2 ${live ? "border-[#2E7C83] ring-1 ring-[#2E7C83]" : "border-[#1a2b4a]/10"}`}>
        <p className="text-[11px] font-medium text-[#2E7C83]">{time(c.start)}</p>
        <p className="text-xs font-semibold leading-snug text-[#1a2b4a] dark:text-[#F8F5F0] line-clamp-2">{c.title}</p>
        {c.joinUrl && (
          <a href={c.joinUrl} target="_blank" rel="noopener noreferrer" className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${live ? "bg-[#2E7C83] text-white" : "border border-[#c9a227] text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
            <Video className="w-3 h-3" aria-hidden /> {live ? "Join now" : "Zoom"}
          </a>
        )}
      </li>
    );
  };

  return (
    <section aria-labelledby="coaching-calls-h" className="rounded-2xl border border-[#c9a227]/30 bg-white dark:bg-[#1a2b4a]/40 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pr-7">
        <h2 id="coaching-calls-h" className="flex items-center gap-2 text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
          <CalendarClock className="w-4 h-4 text-[#c9a227]" aria-hidden /> {week === "next" ? "Next week's coaching calls" : "This week's coaching calls"}
        </h2>
        <Link href="/community/events" className="text-xs font-medium text-[#2E7C83] hover:underline">See all calls and replays</Link>
      </div>
      {calls === null ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : !shown.length ? (
        <p className="text-sm text-[#7a8a99]">No calls scheduled this week or next. See the full schedule on the Collective&apos;s Events page.</p>
      ) : compact ? (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.label} className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7a8a99] mb-1.5">{g.label}</p>
              <ul className="space-y-2">{g.items.map(chip)}</ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <div className="grid grid-cols-5 gap-2 min-w-[600px]">
            {weekDays.map((d) => {
              const items = shown.filter((c) => new Date(c.start).toDateString() === d.toDateString());
              const isToday = d.toDateString() === new Date(now).toDateString();
              return (
                <div key={d.toDateString()} className={`min-w-0 rounded-xl p-1.5 ${isToday ? "bg-[#c9a227]/10 ring-1 ring-[#c9a227]/40" : "bg-[#F8F5F0]/60 dark:bg-white/5"}`}>
                  <p className={`text-center text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${isToday ? "text-[#1a2b4a] dark:text-[#F8F5F0]" : "text-[#7a8a99]"}`}>
                    {d.toLocaleDateString(undefined, { weekday: "short" })} <span className="font-normal">{d.getDate()}</span>
                  </p>
                  {items.length ? <ul className="space-y-1.5">{items.map(chip)}</ul> : <p className="text-center text-[11px] text-[#7a8a99]/60 py-2">—</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
