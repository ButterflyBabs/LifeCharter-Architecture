"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

interface Dim { key: string; label: string; score: number; source: string; tasks: number; needs: string[]; wins: string[] }
interface Biz {
  id: number;
  name: string;
  overall: number | null;
  coverage: { tasks: number; goals: number; ledger: number; sales: number; total: number };
  scoredOnActivity: boolean;
  needs: { dimension: string; label: string; score: number; why: string[] }[];
  progress: { dimension: string; label: string; delta: number | null; why: string[] }[];
  dims: Dim[];
}
interface Payload { selected: { id: number; name: string } | null; businesses: Biz[] }

const tone = (n: number) => (n >= 80 ? "#2c6b3f" : n >= 60 ? "#c9a227" : "#c0632f");

// Per-business health, from the business's own tasks and compliance on top of the account's assessments.
export default function BusinessHealth() {
  const [data, setData] = useState<Payload | null>(null);
  useEffect(() => {
    fetch("/api/business-health", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null));
  }, []);
  if (!data || data.businesses.length === 0) return null;
  const shown = data.selected ? data.businesses.filter((b) => b.id === data.selected!.id) : data.businesses;
  if (shown.length === 0) return null;

  return (
    <section aria-label="Health by business" className="mb-8">
      <div className="mb-2 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[#c9a227]" aria-hidden />
        <h2 className="text-xs font-medium uppercase tracking-wide text-[#b8a898]">
          {data.selected ? `Health for ${data.selected.name}` : "Health by business"}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((b) => (
          <div key={b.id} className="rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-[#c9a227]/20 dark:bg-[#1A1A2E]">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{b.name}</p>
              <span className="font-serif text-3xl" style={{ color: b.overall === null ? "#b8a898" : tone(b.overall) }}>
                {b.overall ?? "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#7C7C82]">
              {b.coverage.total > 0
                ? `Built from ${b.coverage.tasks} task${b.coverage.tasks === 1 ? "" : "s"}${b.dims.some((d) => d.needs.some((x) => /compliance/.test(x)) || d.wins.some((x) => /compliance/.test(x))) ? " and its compliance checklist" : ""}, on top of your assessment scores.`
                : "Nothing is tied to this business yet, so this is your assessment score. Finish tasks and fill in its compliance checklist and it will move."}
            </p>
            {data.selected && (
              <ul className="mt-4 space-y-2">
                {b.dims.map((d) => (
                  <li key={d.key}>
                    <div className="flex items-center justify-between text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                      <span>{d.label}</span>
                      <span className="tabular-nums" style={{ color: tone(d.score) }}>{d.score}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1a2b4a]/10">
                      <div className="h-full rounded-full" style={{ width: `${d.score}%`, background: tone(d.score) }} />
                    </div>
                    {(d.needs[0] || d.wins[0]) && <p className="mt-1 text-xs text-[#7C7C82]">{d.needs[0] || d.wins[0]}</p>}
                  </li>
                ))}
              </ul>
            )}
            {!data.selected && b.needs[0] && (
              <p className="mt-3 text-xs text-[#7C7C82]">
                Lowest: {b.needs[0].label} ({b.needs[0].score}){b.needs[0].why[0] ? `: ${b.needs[0].why[0]}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>
      {!data.selected && <p className="mt-2 text-xs text-[#7C7C82]">Choose a business at the top of the page to see its dimensions.</p>}
    </section>
  );
}
