"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  actualFor, addDays, mondayOf, todayYmd, unitFor, ymd,
  type Goals, type PlannedPost, type PlatformDef, type WeekDoc,
} from "@/lib/social/planner";
import { ScorePill, Spark, Tip, cx } from "./ui";

// Month = the weeks that start in it. Targets are weekly goal × weeks.
// "Suggested" = average of the last 4 full weeks + 25% (percent: +10%).
export function MonthReview({
  month, setMonth, goals, posts, weeks, platforms, onApplyTarget,
}: {
  month: string; // YYYY-MM
  setMonth: (m: string) => void;
  goals: Goals;
  posts: PlannedPost[];
  weeks: Record<string, WeekDoc>;
  platforms: PlatformDef[];
  onApplyTarget: (pid: string, mid: string, target: number) => void;
}) {
  const today = todayYmd();
  const [Y, M] = month.split("-").map(Number);
  const first = ymd(new Date(Y, M - 1, 1));
  const last = ymd(new Date(Y, M, 0));
  const mons: string[] = [];
  for (let m = mondayOf(first); m <= last; m = addDays(m, 7)) if (m.slice(0, 7) === month) mons.push(m);
  const recent: string[] = [];
  for (let m = addDays(mondayOf(today), -7); recent.length < 4; m = addDays(m, -7)) recent.push(m);
  const label = new Date(Y, M - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shift = (n: number) => {
    const d = new Date(Y, M - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={cx.eyebrow}>Monthly review · {mons.length} weeks starting this month</p>
          <h2 className={cx.h2}>{label}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft className="h-5 w-5" /></button>
          {month !== today.slice(0, 7) && <button className={`${cx.btn} ${cx.secondary}`} onClick={() => setMonth(today.slice(0, 7))}>This month</button>}
          <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Next month" onClick={() => shift(1)}><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <Tip>
        Targets here are your weekly goal × {mons.length}. <b>Suggested</b> is your average over the last 4 full weeks plus 25%, a stretch that stays within reach. Use it to reset a goal once you have a month of real numbers.
      </Tip>

      {platforms.map((p) => (
        <div key={p.id} className={cx.card}>
          <h3 className="mb-3 font-display text-xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]">{p.name}</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-[#64748B]">
                  <th className="py-2 font-medium">Goal</th>
                  <th className="py-2 text-right font-medium">Actual</th>
                  <th className="py-2 text-right font-medium">Target</th>
                  <th className="py-2 text-right font-medium">Hit</th>
                  <th className="py-2 pl-4 font-medium">By week</th>
                  <th className="py-2 text-right font-medium">Suggested weekly</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(goals[p.id] || []).map((m) => {
                  const t = Number(m.target) || 0;
                  const vals = mons.map((w) => actualFor(posts, weeks[w], p.id, m, w));
                  const withData = vals.filter((v): v is number => v !== null);
                  let act: number;
                  let tgt: number;
                  if (m.kind === "percent") {
                    act = withData.length ? Math.round(withData.reduce((a, b) => a + b, 0) / withData.length) : 0;
                    tgt = t;
                  } else {
                    act = vals.reduce<number>((a, b) => a + (b || 0), 0);
                    tgt = t * mons.length;
                  }
                  const pct = tgt ? Math.round((act / tgt) * 100) : 0;
                  const rv = recent.map((w) => actualFor(posts, weeks[w], p.id, m, w)).filter((v): v is number => v !== null);
                  let sug: number | null = null;
                  if (m.kind !== "habit" && rv.length >= 2) {
                    const avg = rv.reduce((a, b) => a + b, 0) / rv.length;
                    sug = m.kind === "percent" ? Math.min(100, Math.round(avg * 1.1)) : Math.max(1, Math.round(avg * 1.25));
                  }
                  return (
                    <tr key={m.id} className="border-t border-[#0F1A38]/5 dark:border-[#334060]">
                      <td className="py-2 pr-2">{m.label}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{act}{unitFor(m)}</td>
                      <td className="py-2 text-right tabular-nums">{tgt}{unitFor(m)}</td>
                      <td className="py-2 text-right"><ScorePill pct={pct}>{pct}%</ScorePill></td>
                      <td className="py-2 pl-4">{mons.length > 0 && <Spark values={vals.map((v) => v || 0)} target={t} />}</td>
                      <td className="py-2 text-right tabular-nums">{sug === null ? <span className={cx.muted}>Needs 2+ weeks</span> : `${sug}${unitFor(m)}`}</td>
                      <td className="py-2 pl-2 text-right">
                        {sug !== null && sug !== t && (
                          <button className={`${cx.btn} ${cx.secondary} !py-1`} onClick={() => onApplyTarget(p.id, m.id, sug!)}>Use</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
