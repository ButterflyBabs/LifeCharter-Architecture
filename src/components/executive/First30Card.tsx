"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";

export interface First30 {
  steps: { key: string; week: number; title: string; why?: string; href: string; done: boolean; focus?: string }[];
  done: number;
  total: number;
  day: number;
  show: boolean;
}

// Loads the first-30-days path once; Executive Home shows the card only while it's useful.
export function useFirst30(): First30 | null {
  const [d, setD] = useState<First30 | null>(null);
  useEffect(() => {
    fetch("/api/first30", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => setD(x))
      .catch(() => {});
  }, []);
  return d;
}

const stageName = (w: number) => (w === 0 ? "Start here: your assessments" : `Week ${w}`);

export default function First30Card({ data }: { data: First30 }) {
  // One stage at a time: the assessments first (everything else is informed by them),
  // then Week 1, and each later week only once the one before it is fully checked off.
  const weeks = Array.from(new Set(data.steps.map((s) => s.week))).sort((a, b) => a - b);
  const current = weeks.find((w) => data.steps.some((s) => s.week === w && !s.done));
  const shownWeeks = current === undefined ? [] : [current];
  const finished = current === undefined ? weeks : weeks.filter((w) => w < current);
  const pct = Math.round((data.done / Math.max(data.total, 1)) * 100);
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-[#c9a227]/40 bg-[#FFFFFF] shadow-sm">
      <div className="flex items-center justify-between gap-2 px-6 pb-2 pt-5">
        <h3 className="font-serif text-base text-indigo-900">Your first 30 days</h3>
        <Link href="/first-30-days" className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2E7C83] hover:underline">
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="px-6 pb-5">
        <p className="text-xs text-gray-500">
          Day {Math.min(data.day, 30)} of 30 · {data.done} of {data.total} steps done
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${pct}%` }} />
        </div>
        {finished.length > 0 && current !== undefined && (
          <ul className="mt-3 space-y-1 text-xs text-[#2c6b3f]">
            {finished.map((w) => (
              <li key={w} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {stageName(w)} complete</li>
            ))}
          </ul>
        )}
        {shownWeeks.length ? (
          <div className="mt-3">
            {shownWeeks.map((w, i) => {
              const steps = data.steps.filter((s) => s.week === w);
              const left = steps.filter((s) => !s.done).length;
              return (
                <div key={w} className={i > 0 ? "mt-3 border-t border-gray-200 pt-3" : ""}>
                  <p className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <span>{stageName(w)}</span>
                    <span className="font-medium normal-case tracking-normal">{left ? `${left} to go` : "Done"}</span>
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {steps.map((s) => (
                      <li key={s.key}>
                        {s.done ? (
                          <span className="flex items-center gap-2 text-gray-400 line-through decoration-gray-300">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2c6b3f]" aria-hidden /> <span>{s.title}</span>
                            <span className="sr-only">(done)</span>
                          </span>
                        ) : (
                          <Link href={s.href} className="flex items-center gap-2 text-indigo-900 hover:underline">
                            <Circle className="h-4 w-4 shrink-0 text-[#c9a227]" aria-hidden /> {s.title}
                            {s.focus && <span className="ml-1 rounded-full bg-[#c9a227]/15 px-1.5 text-[10px] font-semibold text-[#8a6a15]">focus</span>}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm text-[#2c6b3f]">
            <CheckCircle2 className="h-4 w-4" /> All done. Beautifully built.
          </p>
        )}
      </div>
    </div>
  );
}
