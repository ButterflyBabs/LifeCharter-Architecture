"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Video } from "lucide-react";

type Call = { id: string; eventId: string; title: string; start: string; end: string; joinUrl: string | null; about: string };

// "This week's coaching calls": the next 7 days of Command Suite coaching calls,
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

  return (
    <section aria-labelledby="coaching-calls-h" className="rounded-2xl border border-[#c9a227]/30 bg-white dark:bg-[#1a2b4a]/40 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 id="coaching-calls-h" className="flex items-center gap-2 text-base font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
          <CalendarClock className="w-4 h-4 text-[#c9a227]" aria-hidden /> {week === "next" ? "Next week's coaching calls" : "This week's coaching calls"}
        </h2>
        <Link href="/community/events" className="text-xs font-medium text-[#2E7C83] hover:underline">See all calls and replays</Link>
      </div>
      {calls === null ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : !shown.length ? (
        <p className="text-sm text-[#7a8a99]">No calls scheduled this week or next. See the full schedule on the Collective&apos;s Events page.</p>
      ) : (
        <div className={compact ? "space-y-3" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
          {groups.map((g) => (
            <div key={g.label} className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7a8a99] mb-1.5">{g.label}</p>
              <ul className="space-y-2">
                {g.items.map((c) => {
                  const start = new Date(c.start).getTime();
                  const end = new Date(c.end).getTime();
                  const live = now >= start - 10 * 60_000 && now < end;
                  return (
                    <li key={c.id} className={`rounded-xl border p-3 ${live ? "border-[#2E7C83] bg-[#2E7C83]/5" : "border-[#1a2b4a]/10"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{c.title}</p>
                          <p className="text-xs text-[#5a6472] dark:text-[#b8c2cf]">{time(c.start)} to {time(c.end)}</p>
                        </div>
                        {c.joinUrl && (
                          <a href={c.joinUrl} target="_blank" rel="noopener noreferrer" className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-[#2E7C83] text-white" : "border border-[#c9a227] text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
                            <Video className="w-3.5 h-3.5" aria-hidden /> {live ? "Join now" : "Zoom"}
                          </a>
                        )}
                      </div>
                      {!compact && c.about && <p className="mt-1.5 text-xs text-[#7a8a99] line-clamp-2">{c.about}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
