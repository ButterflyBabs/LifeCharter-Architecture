"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Users, CalendarDays, Bell } from "lucide-react";

type Summary = { member: boolean; unread?: number; next?: { title: string; start: string } | null };

// Executive Home: a way into The Collective (the community) that's hard to miss, with what's new
// and the next live session. The sidebar link stays too.
export default function CollectiveCard() {
  const [s, setS] = useState<Summary | null>(null);
  useEffect(() => {
    fetch("/api/community/summary", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setS(d ?? { member: false }))
      .catch(() => setS({ member: false }));
  }, []);
  const when = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-gray-200/60 bg-[#FFFFFF] shadow-sm">
      <div className="flex items-center justify-between gap-2 px-6 pb-3 pt-5">
        <h3 className="font-serif text-base text-indigo-900">The Collective</h3>
        <Link href="/community" className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2E7C83] hover:underline">
          Open <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-3 px-6 pb-5 text-sm text-gray-600">
        <p className="flex items-start gap-2">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#7B6B8D]" />
          <span>Your community: group coaching, questions and support, and people building alongside you.</span>
        </p>
        {s?.member && (s.unread ?? 0) > 0 && (
          <p className="flex items-center gap-2 font-medium text-indigo-900">
            <Bell className="h-4 w-4 shrink-0 text-[#c9a227]" /> {s.unread} new notification{s.unread === 1 ? "" : "s"}
          </p>
        )}
        {s?.member && s.next && (
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#7B6B8D]" />
            <span>
              Next live: <span className="font-medium text-indigo-900">{s.next.title}</span>, {when(s.next.start)}
            </span>
          </p>
        )}
        <Link href="/community" className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Go to The Collective <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
