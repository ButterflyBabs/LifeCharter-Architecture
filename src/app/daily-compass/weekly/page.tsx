"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  Circle,
  TrendingUp,
  Flame,
  Trophy,
  Star,
  Phone,
  Share2,
  MessageSquare,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

interface DayRow {
  date: string;
  dayName: string;
  isToday: boolean;
  isFuture: boolean;
  active: boolean;
  calls: number;
  posts: number;
  followups: number;
  tasksDone: number;
}
interface Goal {
  id: string;
  category: string;
  target: number | null;
  current: number;
  unit: string;
}
interface Weekly {
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  today: string;
  days: DayRow[];
  goals: Goal[];
  totals: { calls: number; posts: number; followups: number; tasksDone: number; daysActive: number };
  streak: { current: number; longest: number };
}

const fmt = (day: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, d)));
};

// "Sep 21 – 27, 2026" / "Sep 28 – Oct 4, 2026" / "Dec 28, 2026 – Jan 3, 2027"
function rangeLabel(a: string, b: string): string {
  const sameYear = a.slice(0, 4) === b.slice(0, 4);
  const sameMonth = a.slice(0, 7) === b.slice(0, 7);
  if (sameMonth) return `${fmt(a, { month: "short", day: "numeric" })} – ${fmt(b, { day: "numeric" })}, ${b.slice(0, 4)}`;
  if (sameYear) return `${fmt(a, { month: "short", day: "numeric" })} – ${fmt(b, { month: "short", day: "numeric" })}, ${b.slice(0, 4)}`;
  return `${fmt(a, { month: "short", day: "numeric", year: "numeric" })} – ${fmt(b, { month: "short", day: "numeric", year: "numeric" })}`;
}

function shiftWeek(weekStart: string, weeks: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const n = new Date(Date.UTC(y, m - 1, d + weeks * 7));
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(n.getUTCDate()).padStart(2, "0")}`;
}

export default function WeeklyViewPage() {
  const [data, setData] = useState<Weekly | null>(null);
  const [week, setWeek] = useState<string>(""); // "" = the current week
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (w: string) => {
    setFailed(false);
    try {
      const tz = localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const res = await fetch(`/api/compass-weekly?tz=${encodeURIComponent(tz)}${w ? `&week=${w}` : ""}`);
      if (!res.ok) throw new Error("load failed");
      setData(await res.json());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load(week);
  }, [week, load]);

  const goPrev = () => data && setWeek(shiftWeek(data.weekStart, -1));
  const goNext = () => data && !data.isCurrentWeek && setWeek(shiftWeek(data.weekStart, 1));

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <Link href="/daily-compass" className="flex items-center gap-2 text-[#7b6b8d] hover:text-[#1a2b4a] mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Daily Compass
      </Link>

      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#c9a227]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Weekly View</h1>
              <p className="text-[#5a6472] dark:text-[#c3ccd8]">Your real week — what you did, against your goals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goPrev} disabled={!data} aria-label="Previous week" className="p-2 hover:bg-[#1a2b4a]/10 rounded-lg disabled:opacity-40">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] min-w-[9.5rem] text-center">
              {data ? rangeLabel(data.weekStart, data.weekEnd) : "Loading…"}
            </span>
            <button
              onClick={goNext}
              disabled={!data || data.isCurrentWeek}
              aria-label="Next week"
              className="p-2 hover:bg-[#1a2b4a]/10 rounded-lg disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {data && !data.isCurrentWeek && (
              <button onClick={() => setWeek("")} className="text-sm text-[#2E7C83] hover:underline">
                This week
              </button>
            )}
          </div>
        </div>
      </div>

      {failed && <p className="text-sm text-[#8a2f2f] mb-6">Couldn&apos;t load your week — please refresh.</p>}

      {/* Streak Banner */}
      <Card className="mb-8 bg-gradient-to-r from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-6 h-6 text-[#c9a227]" />
                  <span className="text-3xl font-bold">{data ? data.streak.current : "—"}</span>
                </div>
                <p className="text-sm text-[#e8e4f0]">Day Streak</p>
              </div>
              <div className="h-12 w-px bg-[#e8e4f0]/30" />
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-6 h-6 text-[#c9a227]" />
                  <span className="text-3xl font-bold">{data ? data.streak.longest : "—"}</span>
                </div>
                <p className="text-sm text-[#e8e4f0]">Longest Streak</p>
              </div>
              <div className="h-12 w-px bg-[#e8e4f0]/30" />
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-6 h-6 text-[#c9a227]" />
                  <span className="text-3xl font-bold">{data ? data.totals.daysActive : "—"}</span>
                </div>
                <p className="text-sm text-[#e8e4f0]">Active Days This Week</p>
              </div>
            </div>
            {data && (
              <p className="text-sm text-[#e8e4f0] max-w-xs text-right">
                {data.streak.current === 0
                  ? "Do one thing today — finish a task, log a call, post — to start a streak."
                  : data.streak.current >= data.streak.longest
                  ? "This is your longest streak yet."
                  : `${data.streak.longest - data.streak.current + 1} more day${data.streak.longest - data.streak.current + 1 === 1 ? "" : "s"} to beat your record.`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Week Grid */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">{data?.isCurrentWeek ? "This Week" : "Week of " + (data ? fmt(data.weekStart, { month: "short", day: "numeric" }) : "")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {(data?.days ?? []).map((day) => (
              <Link key={day.date} href="/daily-compass">
                <div
                  className={`p-3 sm:p-4 rounded-lg text-center cursor-pointer transition-all hover:shadow-md h-full ${
                    day.active
                      ? "bg-[#4a9b9b]/20 border-2 border-[#4a9b9b]"
                      : day.isFuture
                      ? "bg-white dark:bg-[#1a2b4a]/30 border-2 border-dashed border-[#1a2b4a]/20"
                      : "bg-[#1a2b4a]/5 border-2 border-[#1a2b4a]/20"
                  } ${day.isToday ? "ring-2 ring-[#c9a227]" : ""}`}
                >
                  <p className="text-sm text-[#5a6472] dark:text-[#c3ccd8] mb-1">{day.dayName}</p>
                  <p className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{Number(day.date.slice(8, 10))}</p>
                  {day.active ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2E7C83] mx-auto mt-2" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#8a94a3] mx-auto mt-2" />
                  )}
                  {day.active && (
                    <div className="mt-2 text-xs text-[#1f6a70] dark:text-[#7fd0d6] space-y-0.5">
                      {day.tasksDone > 0 && <p title="Tasks done">{day.tasksDone} tasks</p>}
                      {day.calls > 0 && <p title="Calls">{day.calls} calls</p>}
                      {day.followups > 0 && <p title="Follow-ups">{day.followups} f-ups</p>}
                      {day.posts > 0 && <p title="Posts">{day.posts} posts</p>}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-[#c9a227]" />
              Weekly Goals
            </CardTitle>
            <Link href="/daily-compass/sales-activities">
              <Button variant="outline" size="sm">
                Set goals
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.goals ?? []).map((goal) => {
              const pct = goal.target ? (goal.current / goal.target) * 100 : 0;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">{goal.category}</span>
                    <span className="text-[#5a6472] dark:text-[#c3ccd8]">
                      {goal.target ? `${goal.current}/${goal.target} ${goal.unit}` : `${goal.current} ${goal.unit} · no goal set`}
                    </span>
                  </div>
                  <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#4a9b9b] to-[#c9a227] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-[#5a6472] dark:text-[#c3ccd8]">
              Goals are the weekly targets you set in Sales Activities. Posting goals live in the Content Calendar.
            </p>
          </CardContent>
        </Card>

        {/* Week Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#c9a227]" />
              Week Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Phone className="w-6 h-6 text-[#7b6b8d] mx-auto mb-2" />, value: data?.totals.calls, label: "Sales Calls" },
                { icon: <Share2 className="w-6 h-6 text-[#4a9b9b] mx-auto mb-2" />, value: data?.totals.posts, label: "Posts Published" },
                { icon: <MessageSquare className="w-6 h-6 text-[#c9a227] mx-auto mb-2" />, value: data?.totals.followups, label: "Follow-ups" },
                { icon: <ListChecks className="w-6 h-6 text-[#1a2b4a] dark:text-[#F8F5F0] mx-auto mb-2" />, value: data?.totals.tasksDone, label: "Tasks Done" },
              ].map((s) => (
                <div key={s.label} className="p-4 bg-[#1a2b4a]/5 rounded-lg text-center">
                  {s.icon}
                  <p className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{s.value ?? "—"}</p>
                  <p className="text-sm text-[#5a6472] dark:text-[#c3ccd8]">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it's counted */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#c9a227]" />
            How This Is Counted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Active day &amp; streak</h3>
              <p className="text-sm text-[#5a6472] dark:text-[#c3ccd8]">
                A day is active when you did at least one thing: finished a task, checked off a recurring task, logged a
                call or follow-up, or published a post. Your streak is the number of active days in a row, ending today.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Where the numbers come from</h3>
              <p className="text-sm text-[#5a6472] dark:text-[#c3ccd8]">
                Calls and follow-ups come from your Global Control contact log, your Sales Activities and follow-up tasks you
                complete. Posts come from your Content Calendar. Tasks come from your task list and recurring tasks.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Weeks &amp; time zone</h3>
              <p className="text-sm text-[#5a6472] dark:text-[#c3ccd8]">
                Weeks run Monday to Sunday in your time zone. Use the arrows to look back at earlier weeks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
