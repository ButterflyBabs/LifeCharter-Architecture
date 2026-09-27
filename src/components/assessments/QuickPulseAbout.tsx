"use client";

import { useEffect, useState } from "react";

// Two plain sentences on when to use the Quick Pulse and what it changes, plus when the next one
// is due (from the same cadence the Alignment Profile's check-in schedule uses). Audit item cs153.
export function QuickPulseAbout() {
  const [due, setDue] = useState<{ lastTaken: string | null; nextDue: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/checkins", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const q = (d?.checkins || []).find((c: { type: string }) => c.type === "quick_pulse");
        if (q) setDue({ lastTaken: q.lastTaken, nextDue: q.nextDue });
      })
      .catch(() => {});
  }, []);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="mb-6 rounded-2xl border border-[#c9a227]/25 bg-[#c9a227]/5 p-4 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
      <p>
        <strong>When to use it:</strong> once a month, or any time your business feels different than it did. It takes about five minutes.
      </p>
      <p className="mt-1">
        <strong>What it changes:</strong> it refreshes your Brain, Soul and Profit scores, adds a point to your progress trend, and turns where you&rsquo;re weakest right now into a few action steps.
      </p>
      {due && (
        <p className="mt-2 text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70">
          {due.lastTaken ? `Last check-in: ${fmt(due.lastTaken)}. ` : "This is your first check-in. "}
          {due.nextDue && due.lastTaken ? `Next one is due ${fmt(due.nextDue)}.` : ""}
        </p>
      )}
    </div>
  );
}
