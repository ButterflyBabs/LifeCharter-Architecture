"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  actualFor, addDays, fmtDate, isWeekday, mondayOf, planCount, platformScore, ratio, todayYmd, unitFor, weekDates,
  type GoalMetric, type Goals, type PlannedPost, type PlatformDef, type WeekDoc,
} from "@/lib/social/planner";
import type { SocialPlannerApi } from "./useSocialPlanner";
import { Bar, ScorePill, cx } from "./ui";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

const nf = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

function MetricRow({ pid, m, mon, posts, w, api }: { pid: string; m: GoalMetric; mon: string; posts: PlannedPost[]; w: WeekDoc | undefined; api: SocialPlannerApi }) {
  const today = todayYmd();
  const a = actualFor(posts, w, pid, m, mon);
  const t = Number(m.target) || 0;
  const r = ratio(a, t);
  let sub: React.ReactNode = null;
  if (m.kind === "plan") {
    const planned = planCount(posts, pid, m, mon, "all");
    sub = <span className={cx.muted}>Counted from the content plan · {planned - (a || 0)} more planned, not yet posted</span>;
  } else if (m.kind === "habit") {
    const h = w?.habits?.[`${pid}.${m.id}`] || {};
    sub = (
      <div className="flex gap-1">
        {weekDates(mon).map((d, i) => {
          const active = m.days !== "weekdays" || isWeekday(d);
          return (
            <button
              key={d}
              disabled={!active}
              aria-pressed={Boolean(h[d])}
              aria-label={fmtDate(d, { weekday: "long" })}
              onClick={() => api.toggleHabit(mon, pid, m.id, d, !h[d])}
              className={`h-7 w-7 rounded-md text-[11px] font-semibold ${
                h[d] ? "bg-[#2E7C83] text-white" : active ? "border border-[#0F1A38]/15 text-[#475569] hover:bg-[#0F1A38]/5 dark:border-[#334060] dark:text-[#CBD5E1]" : "text-[#0F1A38]/20"
              } ${d === today ? "ring-2 ring-[#D4AF63]" : ""}`}
            >
              {DOW[i]}
            </button>
          );
        })}
      </div>
    );
  } else {
    sub = (
      <div className="flex items-center gap-2">
        <input
          key={`${mon}-${pid}-${m.id}-${a ?? ""}`}
          type="number" min={0} step="any"
          defaultValue={a ?? ""}
          placeholder="Enter"
          aria-label={`${m.label} actual`}
          className={`${cx.input} !w-28 !py-1 tabular-nums`}
          onBlur={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            if (v !== a) api.setActual(mon, pid, m.id, v);
          }}
        />
        <span className={cx.muted}>{m.kind === "percent" ? "Weekly average from your analytics" : "From your platform analytics"}</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5 border-t border-[#0F1A38]/5 dark:border-[#334060] py-3 first:border-t-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-[#0F1A38] dark:text-[#FAF8F3]">{m.label}</span>
        <span className="text-sm font-semibold tabular-nums text-[#0F1A38] dark:text-[#FAF8F3]">
          {a ?? 0}{unitFor(m)} <span className="font-normal text-[#64748B]">/ {t}{unitFor(m)}</span>
        </span>
      </div>
      <Bar ratio={r} />
      {sub}
    </div>
  );
}

export function WeekScorecard({
  mon, setMon, goals, posts, weeks, platforms, api,
}: {
  mon: string;
  setMon: (m: string) => void;
  goals: Goals;
  posts: PlannedPost[];
  weeks: Record<string, WeekDoc>;
  platforms: PlatformDef[];
  api: SocialPlannerApi;
}) {
  const today = todayYmd();
  const w = weeks[mon];
  const scores = platforms.map((p) => platformScore(goals, posts, w, p.id, mon));
  const overall = scores.length ? Math.round(scores.reduce((s, x) => s + x.pct, 0) / scores.length) : 0;

  const rateRow = (pid: string) => {
    const a = w?.actuals?.[pid] || {};
    const den = (a.views ?? a.impressions) as number | null | undefined;
    if (a.interactions === undefined || a.interactions === null || !den) return null;
    return (
      <div className="flex items-baseline justify-between border-t border-[#0F1A38]/5 pt-3 dark:border-[#334060]">
        <span className="text-sm text-[#0F1A38] dark:text-[#FAF8F3]">
          Engagement rate this week <span className={cx.muted}>(interactions ÷ {a.views !== undefined ? "views" : "impressions"})</span>
        </span>
        <span className="text-sm font-semibold tabular-nums">{nf((Number(a.interactions) / den) * 100)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={cx.eyebrow}>Weekly scorecard</p>
          <h2 className={cx.h2}>
            {fmtDate(mon, { month: "long", day: "numeric" })} – {fmtDate(addDays(mon, 6), { month: "long", day: "numeric" })}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <ScorePill pct={overall}>{overall}% overall</ScorePill>
          <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Previous week" onClick={() => setMon(addDays(mon, -7))}><ChevronLeft className="h-5 w-5" /></button>
          {mon !== mondayOf(today) && <button className={`${cx.btn} ${cx.secondary}`} onClick={() => setMon(mondayOf(today))}>This week</button>}
          <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label="Next week" onClick={() => setMon(addDays(mon, 7))}><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {platforms.map((p, i) => (
          <div key={p.id} className={cx.card}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="font-display text-xl font-semibold text-[#0F1A38] dark:text-[#FAF8F3]">{p.name}</h3>
              <ScorePill pct={scores[i].pct}>{scores[i].met}/{scores[i].total} met</ScorePill>
            </div>
            {(goals[p.id] || []).length ? (goals[p.id] || []).map((m) => <MetricRow key={m.id} pid={p.id} m={m} mon={mon} posts={posts} w={w} api={api} />) : <p className={cx.muted}>No goals yet.</p>}
            {rateRow(p.id)}
          </div>
        ))}
      </div>

      <div className={`${cx.card} space-y-2`}>
        <h3 className={cx.h3}>What worked this week</h3>
        <textarea
          key={mon}
          rows={4}
          className={cx.input}
          defaultValue={w?.notes || ""}
          placeholder="Which post or episode did best? What will you repeat or drop next week?"
          onBlur={(e) => e.target.value !== (w?.notes || "") && api.setWeekNotes(mon, e.target.value)}
        />
      </div>
    </div>
  );
}
