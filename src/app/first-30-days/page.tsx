"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Sprout } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { useFirst30 } from "@/components/executive/First30Card";

const WEEK_TITLES: Record<number, string> = {
  1: "Week 1 · Your foundation",
  2: "Week 2 · Money & rhythm",
  3: "Week 3 · Systems",
  4: "Week 4 · Momentum",
};

export default function First30Page() {
  const d = useFirst30();
  const steps = (d?.steps ?? []) as { key: string; week: number; title: string; why?: string; href: string; done: boolean }[];
  const pct = d ? Math.round((d.done / Math.max(d.total, 1)) * 100) : 0;
  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c9a227] to-[#2E7C83] flex items-center justify-center">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Your First 30 Days</h1>
          <p className="text-[#7a8a99]">Twelve small steps that turn the Suite into how you run your business. Each one ticks itself off when it&apos;s done.</p>
        </div>
      </div>
      {d && (
        <div className="my-6">
          <p className="text-sm text-[#7a8a99]">
            Day {Math.min(d.day, 30)} of 30 · {d.done} of {d.total} done
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#1a2b4a]/10">
            <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {!d ? (
        <p className="text-[#7a8a99]">Loading…</p>
      ) : (
        <div className="space-y-5">
          {[1, 2, 3, 4].map((w) => (
            <Card key={w}>
              <CardContent className="p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7a8a99]">{WEEK_TITLES[w]}</p>
                <div className="divide-y divide-[#1a2b4a]/10">
                  {steps
                    .filter((s) => s.week === w)
                    .map((s) => (
                      <Link key={s.key} href={s.href} className="flex items-start gap-3 py-3 hover:bg-[#1a2b4a]/5 rounded-lg px-2">
                        {s.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2c6b3f]" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#c9a227]" />}
                        <span>
                          <span className={`block font-medium ${s.done ? "text-[#7a8a99] line-through" : "text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{s.title}</span>
                          {s.why && <span className="block text-xs text-[#7a8a99]">{s.why}</span>}
                        </span>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
